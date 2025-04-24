import { NextRequest, NextResponse } from "next/server";
import {
  getPayPalAccessToken,
  getAllSubscriptions,
  getFallbackSubscriptions,
  getSubscriptionById,
} from "@/lib/paypal";
import { db } from "@/db";
import {
  paypalAccounts,
  subscriptions as subscriptionsTable,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

// Helper function to fetch subscription plan details
async function fetchPlanDetails(planId: string, accessToken: string) {
  try {
    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/billing/plans/${planId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error(`Error fetching plan details for ${planId}:`, error);
  }

  return null;
}

// Format a subscription object into our transaction format
async function formatSubscription(sub: any, accessToken: string) {
  // Get plan name if available
  let planName = "Subscription";
  let planId = null;
  let planPrice = null;
  let planInterval = null;

  if (sub.plan_id) {
    planId = sub.plan_id;
    const planData = await fetchPlanDetails(planId, accessToken);
    if (planData) {
      if (planData.name) {
        planName = planData.name;
      }

      // Extract price and interval information from the plan
      if (planData.billing_cycles && planData.billing_cycles.length > 0) {
        const billingCycle =
          planData.billing_cycles.find(
            (cycle: any) => cycle.tenure_type === "REGULAR",
          ) || planData.billing_cycles[0];

        if (
          billingCycle &&
          billingCycle.pricing_scheme &&
          billingCycle.pricing_scheme.fixed_price
        ) {
          planPrice = billingCycle.pricing_scheme.fixed_price.value;
          // Currency should be the same as the transaction currency
        }

        if (billingCycle && billingCycle.frequency) {
          planInterval = billingCycle.frequency.interval_unit.toLowerCase();
        }
      }
    }
  }

  // Extract amount from the last payment if available
  let amount = "0.00";
  let currency = "USD";

  if (sub.billing_info && sub.billing_info.last_payment) {
    amount = sub.billing_info.last_payment.amount.value || "0.00";
    currency = sub.billing_info.last_payment.amount.currency_code || "USD";
  }

  // Extract buyer email from subscriber info
  const buyerEmail = sub.subscriber?.email_address || "-";

  // Map the subscription to look like a transaction
  return {
    id: sub.id,
    orderId: sub.id,
    amount: amount,
    currency: currency,
    status: sub.status,
    platformFee: "0.00", // Platform fee info is not available in subscription api
    createdAt: sub.create_time || sub.start_time,
    buyerEmail: buyerEmail,
    paymentType: "SUBSCRIPTION",
    description: planName,
    planId: planId,
    planPrice: planPrice,
    planInterval: planInterval,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get orgId from query params
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    // Check if specific subscription ID is provided in the query for testing
    const specificSubscriptionId = searchParams.get("subscriptionId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // First check if this organization has an active PayPal account
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

    // If the account is not active, return an empty array
    if (account.status !== "active") {
      return NextResponse.json([]);
    }

    // Get PayPal access token
    let accessToken;
    try {
      accessToken = await getPayPalAccessToken();
    } catch (error) {
      console.error("Error getting PayPal access token:", error);
      return NextResponse.json(
        { error: "Failed to authenticate with PayPal" },
        { status: 500 },
      );
    }

    let subscriptionsToProcess: any[] = [];

    // First check if we have a specific subscription ID to fetch
    if (specificSubscriptionId) {
      const subscription = await getSubscriptionById(
        specificSubscriptionId,
        accessToken,
      );
      if (subscription) {
        subscriptionsToProcess = [subscription];
      }
    }

    // If no specific subscription ID or it wasn't found, check the database
    if (subscriptionsToProcess.length === 0) {
      try {
        const storedSubscriptions = await db
          .select()
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.orgId, orgId))
          .orderBy(desc(subscriptionsTable.createdAt));

        if (storedSubscriptions.length > 0) {
          // Fetch current details for each stored subscription
          for (const storedSub of storedSubscriptions) {
            const subscription = await getSubscriptionById(
              storedSub.subscriptionId,
              accessToken,
            );
            if (subscription) {
              subscriptionsToProcess.push(subscription);
            }
          }
        }
      } catch (error) {
        console.error("Error processing subscriptions:", error);
      }
    }

    // If we still don't have any subscriptions, try to get them directly from PayPal
    if (subscriptionsToProcess.length === 0) {
      const paypalSubscriptions = await getAllSubscriptions();

      if (paypalSubscriptions.length > 0) {
        subscriptionsToProcess = paypalSubscriptions;

        // Store these subscriptions in the database for future use
        for (const sub of paypalSubscriptions) {
          try {
            // Check if subscription already exists
            const existing = await db
              .select()
              .from(subscriptionsTable)
              .where(eq(subscriptionsTable.subscriptionId, sub.id))
              .limit(1);

            if (existing.length === 0) {
              // Extract data
              const {
                id: subscriptionId,
                plan_id: planId,
                status,
                start_time: startDate,
                create_time: createTime,
                subscriber,
                billing_info,
              } = sub;

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

              // Insert into database
              await db.insert(subscriptionsTable).values({
                paypalAccountId: account.id,
                orgId,
                subscriptionId,
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
                metadata: sub,
              });
            }
          } catch (error) {
            console.error(
              `Error storing subscription ${sub.id} in database:`,
              error,
            );
          }
        }
      }
    }

    // As a last resort, use fallback hardcoded subscription IDs
    if (subscriptionsToProcess.length === 0) {
      const fallbackSubscriptions = await getFallbackSubscriptions();

      if (fallbackSubscriptions.length > 0) {
        subscriptionsToProcess = fallbackSubscriptions;

        // Store these in the database for future use
        for (const sub of fallbackSubscriptions) {
          try {
            // Check if subscription already exists
            const existing = await db
              .select()
              .from(subscriptionsTable)
              .where(eq(subscriptionsTable.subscriptionId, sub.id))
              .limit(1);

            if (existing.length === 0) {
              // Extract data
              const {
                id: subscriptionId,
                plan_id: planId,
                status,
                start_time: startDate,
                create_time: createTime,
                subscriber,
                billing_info,
              } = sub;

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

              // Insert into database
              await db.insert(subscriptionsTable).values({
                paypalAccountId: account.id,
                orgId,
                subscriptionId,
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
                metadata: sub,
              });
            }
          } catch (error) {
            console.error(
              `Error storing fallback subscription ${sub.id} in database:`,
              error,
            );
          }
        }
      }
    }

    // If we still have no subscriptions, return empty array
    if (subscriptionsToProcess.length === 0) {
      return NextResponse.json([]);
    }

    // Format the subscriptions as transactions
    const formattedTransactions = await Promise.all(
      subscriptionsToProcess.map((sub) => formatSubscription(sub, accessToken)),
    );

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching subscription transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription transactions" },
      { status: 500 },
    );
  }
}
