import { createPayPalClient } from "./client";
import { db } from "@/db";
import { paypalAccounts } from "@/db/schema";
import checkoutNodeSdk from "@paypal/checkout-server-sdk";
import { eq } from "drizzle-orm";
import { getPayPalAccessToken } from "@/lib/paypal";

// Get a merchant-specific PayPal client based on organization ID
export async function getMerchantPayPalClient(orgId: string) {
  // For now, we'll use the platform credentials
  // In a real implementation, you would fetch merchant-specific credentials
  return createPayPalClient();
}

// Create a PayPal order with platform fee
export async function createOrderWithPlatformFee({
  amount,
  currency = "USD",
  description,
  platformFee,
  orgId,
}: {
  amount: string;
  currency?: string;
  description?: string;
  platformFee: string;
  orgId: string;
}) {
  const client = await getMerchantPayPalClient(orgId);

  // Find the merchant's PayPal account
  const accounts = await db.select().from(paypalAccounts);
  const merchantAccount = accounts.find((account) => account.orgId === orgId);

  if (!merchantAccount) {
    throw new Error("Merchant PayPal account not found");
  }

  // Log merchant account details for debugging
  console.log("Creating order with merchant account:", {
    merchantId: merchantAccount.merchantId,
    email: merchantAccount.email,
    status: merchantAccount.status,
  });

  // Create a new OrdersCreateRequest
  const request = new checkoutNodeSdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");

  // Parse and format monetary values
  const amountValue = parseFloat(amount);
  const feeValue = parseFloat(platformFee);

  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amountValue.toFixed(2),
        },
        description: description || "Purchase",
        // Platform fee handling - simpler approach without nested breakdown
        payment_instruction: {
          disbursement_mode: "INSTANT",
          platform_fees: [
            {
              amount: {
                currency_code: currency,
                value: feeValue.toFixed(2),
              },
            },
          ],
        },
      },
    ],
  });

  try {
    const response = await client.execute(request);
    return response.result;
  } catch (err) {
    console.error("PayPal API error:", err);
    throw err;
  }
}

// Capture a previously created PayPal order
export async function captureOrder({
  orderId,
  orgId,
}: {
  orderId: string;
  orgId: string;
}) {
  const client = await getMerchantPayPalClient(orgId);

  const request = new checkoutNodeSdk.orders.OrdersCaptureRequest(orderId);
  request.prefer("return=representation");

  try {
    const response = await client.execute(request);
    return response.result;
  } catch (err) {
    console.error("PayPal API error:", err);
    throw err;
  }
}

// Setup webhook for merchant
export async function setupMerchantWebhook({
  orgId,
  notificationUrl,
}: {
  orgId: string;
  notificationUrl: string;
}) {
  const client = await getMerchantPayPalClient(orgId);
  const accessToken = await getPayPalAccessToken();

  if (!accessToken) {
    throw new Error("Failed to get PayPal access token for webhook setup");
  }

  // Create webhook with supported event types
  const webhookRequest = {
    url: notificationUrl,
    event_types: [
      { name: "PAYMENT.CAPTURE.COMPLETED" },
      { name: "PAYMENT.CAPTURE.DENIED" },
      { name: "PAYMENT.CAPTURE.REFUNDED" },
      { name: "CHECKOUT.ORDER.COMPLETED" },
      { name: "CHECKOUT.ORDER.APPROVED" },
      { name: "BILLING.SUBSCRIPTION.CREATED" },
      { name: "BILLING.SUBSCRIPTION.ACTIVATED" },
      { name: "BILLING.SUBSCRIPTION.CANCELLED" },
    ],
  };

  try {
    // Create the webhook via PayPal API
    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/notifications/webhooks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(webhookRequest),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PayPal webhook creation error:", errorData);
      throw new Error(
        `Failed to create PayPal webhook: ${errorData.message || "Unknown error"}`,
      );
    }

    const webhookData = await response.json();

    // Update the merchant account with the webhook ID
    if (webhookData.id) {
      const accounts = await db.select().from(paypalAccounts);
      const account = accounts.find((account) => account.orgId === orgId);

      if (account) {
        await db
          .update(paypalAccounts)
          .set({
            webhookId: webhookData.id,
            updatedAt: new Date(),
          })
          .where(eq(paypalAccounts.id, account.id));
      }
    }

    return webhookData;
  } catch (err) {
    console.error("Error creating PayPal webhook:", err);
    throw err;
  }
}
