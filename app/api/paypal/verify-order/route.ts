import { NextRequest, NextResponse } from "next/server";
import { getMerchantPayPalClient } from "@/lib/paypal/multiparty";
import { db } from "@/db";
import { paypalAccounts } from "@/db/schema";
import checkoutNodeSdk from "@paypal/checkout-server-sdk";

// Define a type for the PayPal order result
type PayPalOrderResult = {
  id: string;
  status: string;
  intent: string;
  create_time: string;
  update_time: string;
  // Add other fields as needed
};

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get("orderId");
    const orgId = req.nextUrl.searchParams.get("orgId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Required parameter: orderId" },
        { status: 400 },
      );
    }

    // If orgId isn't provided, we'll try to find it from the order details
    let client;

    if (orgId) {
      // Get client with specific merchant credentials
      client = await getMerchantPayPalClient(orgId);
    } else {
      // Use platform client as fallback
      const accounts = await db.select().from(paypalAccounts);
      // Find first active account as fallback
      const fallbackAccount = accounts.find(
        (account) => account.status === "active",
      );

      if (!fallbackAccount) {
        return NextResponse.json(
          { error: "No PayPal account available to verify order" },
          { status: 400 },
        );
      }

      client = await getMerchantPayPalClient(fallbackAccount.orgId);
    }

    // Create order get request
    const orderRequest = new checkoutNodeSdk.orders.OrdersGetRequest(orderId);

    // Execute the request
    const response = await client.execute(orderRequest);
    const orderDetails = response.result as PayPalOrderResult;

    // Return order status and minimal details
    return NextResponse.json({
      id: orderDetails.id,
      status: orderDetails.status,
      intent: orderDetails.intent,
      create_time: orderDetails.create_time,
      update_time: orderDetails.update_time,
    });
  } catch (error) {
    console.error("Error verifying PayPal order:", error);

    let errorMessage = "Failed to verify PayPal order";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
