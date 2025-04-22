import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getPayPalAccessToken } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 },
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Create subscription
    const application_context = {
      return_url: `${baseUrl}/api/paypal/return/subscription?orgId=${orgId}`,
      cancel_url: `${baseUrl}/api/paypal/cancel/subscription?orgId=${orgId}`,
      user_action: "SUBSCRIBE_NOW",
      payment_method: {
        payer_selected: "PAYPAL",
        payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
      },
    };

    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/billing/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "PayPal-Partner-Attribution-Id": process.env.PAYPAL_BN_CODE || "",
        },
        body: JSON.stringify({
          plan_id: planId,
          application_context,
          custom_id: orgId, // Store organization ID as custom ID
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PayPal API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: response.status },
      );
    }

    const subscriptionData = await response.json();

    // Note: In a production environment, you would save the subscription details
    // to your database here. For simplicity, we're skipping that step.

    return NextResponse.json(subscriptionData);
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
