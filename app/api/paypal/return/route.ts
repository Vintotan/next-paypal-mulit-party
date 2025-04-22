import { NextRequest, NextResponse } from "next/server";
import { getMerchantPayPalClient } from "@/lib/paypal/multiparty";
import checkoutNodeSdk from "@paypal/checkout-server-sdk";

// Define type for PayPal order response
type PayPalOrderResponse = {
  id: string;
  status: string;
  intent?: string;
  create_time?: string;
  update_time?: string;
};

export async function GET(req: NextRequest) {
  try {
    // Get order ID from query parameters
    const orderId = req.nextUrl.searchParams.get("order_id");
    const sessionToken = req.nextUrl.searchParams.get("session_token");
    const token = req.nextUrl.searchParams.get("token") || orderId; // PayPal might return it as 'token'

    if (!token && !orderId) {
      return new Response("Missing order ID", { status: 400 });
    }

    // We'll use the order ID from our parameter first, fallback to token
    const paypalOrderId = orderId || token || "";

    // Verify the order status for better UX
    try {
      // Use a general client since we're just verifying
      const client = await getMerchantPayPalClient(
        process.env.DEFAULT_ORG_ID || "",
      );
      const request = new checkoutNodeSdk.orders.OrdersGetRequest(
        paypalOrderId,
      );
      const response = await client.execute(request);
      const orderDetails = response.result as PayPalOrderResponse;

      // Generate HTML with JavaScript to send a message to the opener window
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Processing</title>
          <style>
            body { 
              font-family: system-ui, sans-serif;
              text-align: center;
              padding: 2rem;
              max-width: 500px;
              margin: 0 auto;
              line-height: 1.5;
            }
            .status {
              font-size: 1.2rem;
              margin: 1rem 0;
            }
            .success { color: #2E7D32; }
            .pending { color: #F57C00; }
          </style>
        </head>
        <body>
          <h1>Payment ${orderDetails.status === "COMPLETED" ? "Successful" : "Processing"}</h1>
          <div class="status ${orderDetails.status === "COMPLETED" ? "success" : "pending"}">
            ${
              orderDetails.status === "COMPLETED"
                ? "Your payment has been completed successfully!"
                : "Your payment is being processed. You will be notified once complete."
            }
          </div>
          <p>You can close this window now.</p>
          
          <script>
            // Send message to parent window
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({
                type: 'paypal_return',
                status: '${orderDetails.status}',
                orderId: '${paypalOrderId}',
                sessionToken: '${sessionToken}'
              }, window.location.origin);
              
              // Close this window after a short delay
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
        </html>
      `;

      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    } catch (err) {
      console.error("Error verifying order status:", err);

      // Still provide a return page even if verification fails
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Processing</title>
          <style>
            body { 
              font-family: system-ui, sans-serif;
              text-align: center;
              padding: 2rem;
              max-width: 500px;
              margin: 0 auto;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <h1>Payment Processing</h1>
          <p>We've received your payment information and are processing your payment.</p>
          <p>You can close this window now.</p>
          
          <script>
            // Send message to parent window with minimal info
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({
                type: 'paypal_return',
                status: 'UNKNOWN',
                orderId: '${paypalOrderId}',
                sessionToken: '${sessionToken || ""}'
              }, window.location.origin);
              
              // Close this window after a short delay
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
        </html>
      `;

      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }
  } catch (error) {
    console.error("Error in PayPal return handler:", error);
    return NextResponse.json(
      { error: "Failed to process return" },
      { status: 500 },
    );
  }
}
