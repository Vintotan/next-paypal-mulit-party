import { createPayPalClient, PayPalEnvironmentConfig } from "./client";
import { db } from "@/db";
import { paypalAccounts } from "@/db/schema";

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

  // Create order with platform fee
  const request = new client.orders.OrdersCreateRequest();
  request.prefer("return=representation");

  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount,
          breakdown: {
            item_total: {
              currency_code: currency,
              value: amount,
            },
          },
        },
        description,
        payee: {
          merchant_id: merchantAccount.merchantId,
          email_address: merchantAccount.email || undefined,
        },
        payment_instruction: {
          platform_fees: [
            {
              amount: {
                currency_code: currency,
                value: platformFee,
              },
            },
          ],
        },
      },
    ],
  });

  const response = await client.execute(request);
  return response.result;
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

  const request = new client.orders.OrdersCaptureRequest(orderId);
  request.prefer("return=representation");

  const response = await client.execute(request);
  return response.result;
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

  // Create webhook for this merchant
  const webhookRequest = {
    url: notificationUrl,
    event_types: [
      { name: "PAYMENT.CAPTURE.COMPLETED" },
      { name: "PAYMENT.CAPTURE.DENIED" },
      { name: "PAYMENT.CAPTURE.REFUNDED" },
    ],
  };

  // This is a placeholder for actual webhook creation
  // In a real implementation, you would use the appropriate PayPal API
  console.log("Creating webhook for merchant", orgId, webhookRequest);

  // Return a mock response for now
  return {
    id: "webhook-id-" + Date.now(),
    url: notificationUrl,
  };
}
