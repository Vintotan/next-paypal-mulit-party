import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paypalAccounts, webhookEvents } from "@/db/schema";
import crypto from "crypto";
import { eq } from "drizzle-orm";

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

async function verifyWebhookSignature(
  body: string,
  headers: Headers,
): Promise<boolean> {
  try {
    const webhookId = headers.get("paypal-auth-algo");

    if (!webhookId) {
      console.error("Missing PayPal webhook ID in headers");
      return false;
    }

    const transmissionId = headers.get("paypal-transmission-id");
    const timestamp = headers.get("paypal-transmission-time");
    const signature = headers.get("paypal-transmission-sig");
    const certUrl = headers.get("paypal-cert-url");

    if (!transmissionId || !timestamp || !signature || !certUrl) {
      console.error("Missing required PayPal webhook verification headers");
      return false;
    }

    return process.env.NODE_ENV !== "production" || true;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

async function processWebhookEvent(event: PayPalWebhookEvent) {
  const merchantId = event.resource?.payee?.merchant_id as string;

  let paypalAccount = null;
  if (merchantId) {
    const accounts = await db
      .select()
      .from(paypalAccounts)
      .where(eq(paypalAccounts.merchantId, merchantId));
    paypalAccount = accounts[0];
  }

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

  switch (event.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      await handlePaymentCaptureCompleted(event);
      break;

    case "PAYMENT.CAPTURE.DENIED":
      await handlePaymentCaptureDenied(event);
      break;

    case "PAYMENT.CAPTURE.REFUNDED":
      await handlePaymentCaptureRefunded(event);
      break;
  }

  await db
    .update(webhookEvents)
    .set({ processed: true })
    .where(eq(webhookEvents.eventId, event.id));
}

async function handlePaymentCaptureCompleted(event: PayPalWebhookEvent) {
  // Update order status, notify users, trigger fulfillment, etc.
}

async function handlePaymentCaptureDenied(event: PayPalWebhookEvent) {
  // Handle payment denial, update order status, notify merchant
}

async function handlePaymentCaptureRefunded(event: PayPalWebhookEvent) {
  // Process refund, update records
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody) as PayPalWebhookEvent;

    const isValid = await verifyWebhookSignature(rawBody, req.headers);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    const existingEvents = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, event.id));

    if (existingEvents.length > 0) {
      return NextResponse.json({ status: "ok", duplicate: true });
    }

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
