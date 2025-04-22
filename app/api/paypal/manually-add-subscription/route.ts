import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, paypalAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPayPalAccessToken } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    const { orgId, subscriptionId } = await request.json();

    if (!orgId || !subscriptionId) {
      return NextResponse.json(
        { error: "Organization ID and Subscription ID are required" },
        { status: 400 },
      );
    }

    // Check if we have a PayPal account for this organization
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

    // Get subscription details from PayPal
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
      return NextResponse.json(
        { error: "Failed to fetch subscription from PayPal" },
        { status: response.status },
      );
    }

    const subscriptionData = await response.json();

    // Extract important information
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

    // Check if subscription already exists in database
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

      return NextResponse.json({
        success: true,
        message: `Updated subscription ${paypalSubscriptionId} in database`,
        subscription: subscriptionData,
      });
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

      return NextResponse.json({
        success: true,
        message: `Saved subscription ${paypalSubscriptionId} to database`,
        subscription: subscriptionData,
      });
    }
  } catch (error) {
    console.error("Error saving subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
