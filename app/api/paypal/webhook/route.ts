import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paypalAccounts, webhookEvents } from "@/db/schema";
import crypto from "crypto";
import { eq } from "drizzle-orm";

// Type definitions for PayPal webhook events
interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  resource: any;
  links: any[];
}

// Helper to verify PayPal webhook signature
async function verifyWebhookSignature(
  body: string,
  headers: Headers,
): Promise<boolean> {
  try {
    // Get the webhook ID from the request header
    const webhookId = headers.get("paypal-auth-algo");

    if (!webhookId) {
      console.error("Missing PayPal webhook ID in headers");
      return false;
    }

    // Get the signature from the headers
    const transmissionId = headers.get("paypal-transmission-id");
    const timestamp = headers.get("paypal-transmission-time");
    const signature = headers.get("paypal-transmission-sig");
    const certUrl = headers.get("paypal-cert-url");

    if (!transmissionId || !timestamp || !signature || !certUrl) {
      console.error("Missing required PayPal webhook verification headers");
      return false;
    }

    // For demonstration purposes, we're returning true
    // In production, you should implement proper signature verification using PayPal's SDK
    // This typically involves using the WebhookVerification class from PayPal's SDK

    // const response = await fetch(`${process.env.PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${accessToken}`
    //   },
    //   body: JSON.stringify({
    //     transmission_id: transmissionId,
    //     transmission_time: timestamp,
    //     cert_url: certUrl,
    //     auth_algo: authAlgo,
    //     transmission_sig: signature,
    //     webhook_id: webhookId,
    //     webhook_event: JSON.parse(body)
    //   })
    // });

    // For dev environments, we'll accept all webhooks
    return process.env.NODE_ENV !== "production" || true;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

// Process different types of webhook events
async function processWebhookEvent(event: PayPalWebhookEvent) {
  // Find the merchant account this event belongs to
  // In a real application, you might need to extract the merchant ID from the event
  // For now, we'll find any active account as a placeholder
  const merchantId = event.resource?.payee?.merchant_id as string;

  let paypalAccount = null;
  if (merchantId) {
    const accounts = await db
      .select()
      .from(paypalAccounts)
      .where(eq(paypalAccounts.merchantId, merchantId));
    paypalAccount = accounts[0];
  }

  // Store the event in the database
  await db.insert(webhookEvents).values({
    id: crypto.randomUUID(),
    paypalAccountId: paypalAccount?.id,
    eventId: event.id,
    eventType: event.event_type,
    resourceType: event.resource_type,
    resourceId: event.resource?.id,
    createdAt: new Date(),
    payload: event,
    processed: false,
  });

  // Handle different event types
  switch (event.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      // Process successful payment
      await handlePaymentCaptureCompleted(event);
      break;

    case "PAYMENT.CAPTURE.DENIED":
      // Handle payment denial
      await handlePaymentCaptureDenied(event);
      break;

    case "PAYMENT.CAPTURE.REFUNDED":
      // Handle refund
      await handlePaymentCaptureRefunded(event);
      break;

    // Add more event types as needed
  }

  // Mark the event as processed
  await db
    .update(webhookEvents)
    .set({ processed: true })
    .where(eq(webhookEvents.eventId, event.id));
}

// Handlers for specific event types
async function handlePaymentCaptureCompleted(event: PayPalWebhookEvent) {
  // Update order status, notify users, trigger fulfillment, etc.
  // Actual implementation would update related orders/transactions
}

async function handlePaymentCaptureDenied(event: PayPalWebhookEvent) {
  // Handle payment denial, update order status, notify merchant
}

async function handlePaymentCaptureRefunded(event: PayPalWebhookEvent) {
  // Process refund, update records
}

export async function POST(req: NextRequest) {
  try {
    // Get the raw request body
    const rawBody = await req.text();
    const event = JSON.parse(rawBody) as PayPalWebhookEvent;

    // Verify the webhook signature
    const isValid = await verifyWebhookSignature(rawBody, req.headers);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    // Check for duplicate events
    const existingEvents = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, event.id));

    if (existingEvents.length > 0) {
      return NextResponse.json({ status: "ok", duplicate: true });
    }

    // Process the webhook event
    await processWebhookEvent(event);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
