import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, paypalAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPayPalAccessToken } from "@/lib/paypal";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get("orgId");
    const subscriptionId = searchParams.get("subscription_id");

    // Log successful subscription
    console.log(
      `Subscription successful for organization ${orgId}, ID: ${subscriptionId}`,
    );

    // If we have an org ID and subscription ID, save it to the database
    if (orgId && subscriptionId) {
      try {
        // Check if we have a PayPal account for this organization
        const accounts = await db
          .select()
          .from(paypalAccounts)
          .where(eq(paypalAccounts.orgId, orgId))
          .limit(1);

        if (accounts.length) {
          const account = accounts[0];

          // Get subscription details from PayPal
          const accessToken = await getPayPalAccessToken();
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

          if (response.ok) {
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
                lastPaymentAmount =
                  billing_info.last_payment.amount?.value || "0.00";
                currency =
                  billing_info.last_payment.amount?.currency_code || "USD";
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

              console.log(
                `Updated subscription ${paypalSubscriptionId} in database`,
              );
            } else {
              // Create new subscription record
              await db.insert(subscriptions).values({
                paypalAccountId: account.id,
                orgId,
                subscriptionId: paypalSubscriptionId,
                planId,
                status,
                startDate: startDate
                  ? new Date(startDate)
                  : new Date(createTime),
                nextBillingDate: nextBillingDate
                  ? new Date(nextBillingDate)
                  : null,
                lastPaymentDate: lastPaymentDate
                  ? new Date(lastPaymentDate)
                  : null,
                lastPaymentAmount,
                currency,
                buyerEmail: subscriber?.email_address || null,
                metadata: subscriptionData,
              });

              console.log(
                `Saved subscription ${paypalSubscriptionId} to database`,
              );
            }
          }
        }
      } catch (dbError) {
        console.error("Error saving subscription to database:", dbError);
        // Continue with the redirect even if saving fails
      }
    }

    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Redirect to success page
    return NextResponse.redirect(
      `${baseUrl}/subscription-success?subscription_id=${subscriptionId}`,
    );
  } catch (error) {
    console.error("Error in subscription return handler:", error);

    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Redirect to error page
    return NextResponse.redirect(
      `${baseUrl}/error?message=subscription-return-error`,
    );
  }
}
