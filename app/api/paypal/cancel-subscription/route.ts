import { db } from "@/db";
import { subscriptions, paypalAccounts } from "@/db/schema";
import { getAuth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { orgId } = getAuth(request);
    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized, missing organization" },
        { status: 401 },
      );
    }

    // Get subscription ID from request body
    const { subscriptionId } = await request.json();
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Missing subscription ID" },
        { status: 400 },
      );
    }

    // Get subscription data from database
    const subscriptionResults = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .limit(1);

    const subscription = subscriptionResults[0];

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    // Verify organization has permission to cancel this subscription
    if (subscription.orgId !== orgId) {
      return NextResponse.json(
        { error: "Unauthorized to cancel this subscription" },
        { status: 403 },
      );
    }

    // Get PayPal account for this organization
    const accounts = await db
      .select()
      .from(paypalAccounts)
      .where(eq(paypalAccounts.orgId, orgId))
      .limit(1);

    const paypalAccount = accounts[0];

    if (!paypalAccount) {
      return NextResponse.json(
        { error: "PayPal account not found" },
        { status: 404 },
      );
    }

    // Get access token - either from credentials or fallback to global token
    let accessToken: string;

    if (
      paypalAccount.credentials &&
      typeof paypalAccount.credentials === "object" &&
      "access_token" in paypalAccount.credentials
    ) {
      // Use merchant-specific token if available
      accessToken = (paypalAccount.credentials as { access_token: string })
        .access_token;
    } else {
      // Fallback to global PayPal token in development environment
      accessToken = await getPayPalAccessToken();
    }

    // Use PayPal API to cancel the subscription
    const baseUrl = process.env.PAYPAL_API_URL;

    const response = await fetch(
      `${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reason: "Merchant initiated cancellation",
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PayPal API error:", errorData);
      return NextResponse.json(
        { error: "Failed to cancel subscription with PayPal" },
        { status: response.status },
      );
    }

    // Update subscription status in database
    await db
      .update(subscriptions)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.subscriptionId, subscriptionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
