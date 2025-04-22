import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Get order ID from query parameters
    const orderId = req.nextUrl.searchParams.get("order_id");
    const sessionToken = req.nextUrl.searchParams.get("session_token");
    const token = req.nextUrl.searchParams.get("token") || orderId; // PayPal might return it as 'token'

    // We'll use the order ID from our parameter first, fallback to token
    const paypalOrderId = orderId || token || "";

    // Generate HTML with JavaScript to send a message to the opener window
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Cancelled</title>
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
            color: #F57C00;
          }
        </style>
      </head>
      <body>
        <h1>Payment Cancelled</h1>
        <div class="status">
          You have cancelled the payment process.
        </div>
        <p>You can close this window now.</p>
        
        <script>
          // Send message to parent window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'paypal_return',
              status: 'CANCELED',
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
  } catch (error) {
    console.error("Error in PayPal cancel handler:", error);
    return NextResponse.json(
      { error: "Failed to process cancel" },
      { status: 500 },
    );
  }
}
