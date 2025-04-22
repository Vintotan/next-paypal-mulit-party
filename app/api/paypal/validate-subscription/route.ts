import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getPayPalAccessToken } from "@/lib/paypal";
import { db } from "@/db";
import { subscriptions, paypalAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 },
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Fetch subscription details from PayPal
    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PayPal API error:", errorData);
      return NextResponse.json(
        { error: "Failed to validate subscription" },
        { status: response.status },
      );
    }

    const subscriptionData = await response.json();

    // Check if subscription is active
    if (
      subscriptionData.status !== "ACTIVE" &&
      subscriptionData.status !== "APPROVED"
    ) {
      return NextResponse.json(
        {
          error: `Subscription is not active. Status: ${subscriptionData.status}`,
        },
        { status: 400 },
      );
    }

    // Find the PayPal account for this organization
    const accounts = await db
      .select()
      .from(paypalAccounts)
      .where(eq(paypalAccounts.orgId, orgId))
      .limit(1);

    if (!accounts.length) {
      return NextResponse.json(
        { error: "No PayPal account found for this organization" },
        { status: 404 },
      );
    }

    const account = accounts[0];

    // Extract important information from the subscription data
    const {
      id: paypalSubscriptionId,
      plan_id: planId,
      status,
      start_time: startDate,
      create_time: createTime,
      subscriber,
      billing_info,
    } = subscriptionData;

    let lastPaymentDate = null;
    let lastPaymentAmount = "0.00";
    let currency = "USD";
    let nextBillingDate = null;

    if (billing_info) {
      if (billing_info.last_payment) {
        lastPaymentDate = billing_info.last_payment.time;
        lastPaymentAmount = billing_info.last_payment.amount?.value || "0.00";
        currency = billing_info.last_payment.amount?.currency_code || "USD";
      }
      if (billing_info.next_billing_time) {
        nextBillingDate = billing_info.next_billing_time;
      }
    }

    // Save or update the subscription in the database
    // First check if it already exists
    const existingSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, paypalSubscriptionId))
      .limit(1);

    if (existingSubscriptions.length) {
      // Update existing subscription
      await db
        .update(subscriptions)
        .set({
          status,
          updatedAt: new Date(),
          nextBillingDate: nextBillingDate
            ? new Date(nextBillingDate)
            : undefined,
          lastPaymentDate: lastPaymentDate
            ? new Date(lastPaymentDate)
            : undefined,
          lastPaymentAmount,
          currency,
          buyerEmail: subscriber?.email_address || null,
        })
        .where(eq(subscriptions.subscriptionId, paypalSubscriptionId));

      console.log(`Updated subscription ${paypalSubscriptionId} in database`);
    } else {
      // Create new subscription record
      await db.insert(subscriptions).values({
        paypalAccountId: account.id,
        orgId,
        subscriptionId: paypalSubscriptionId,
        planId,
        status,
        startDate: startDate ? new Date(startDate) : new Date(createTime),
        nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
        lastPaymentDate: lastPaymentDate ? new Date(lastPaymentDate) : null,
        lastPaymentAmount,
        currency,
        buyerEmail: subscriber?.email_address || null,
        metadata: subscriptionData,
      });

      console.log(`Saved subscription ${paypalSubscriptionId} to database`);
    }

    return NextResponse.json({
      message: "Subscription validated and saved successfully",
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error("Error validating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
