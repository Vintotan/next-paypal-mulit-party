// app/api/paypal/onboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import paypalClient from "@/lib/paypal/client";
import { db } from "@/db";
import { paypalAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { setupMerchantWebhook } from "@/lib/paypal/multiparty";

export async function POST(req: NextRequest) {
  const request = new paypalClient.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    // build out referral body
  });

  try {
    const response = await paypalClient.execute(request);
    return NextResponse.json(response.result);
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Extract PayPal return URL parameters
  const merchantIdInPayPal = url.searchParams.get("merchantIdInPayPal");
  const trackingId = url.searchParams.get("merchantId");
  const permissionsGranted = url.searchParams.get("permissionsGranted");
  const accountStatus = url.searchParams.get("accountStatus");
  const consentStatus = url.searchParams.get("consentStatus");
  const isEmailConfirmed = url.searchParams.get("isEmailConfirmed");

  // Validate required parameters
  if (!merchantIdInPayPal || !trackingId || permissionsGranted !== "true") {
    return NextResponse.redirect(
      `${url.origin}?error=Invalid or missing PayPal onboarding parameters`,
    );
  }

  try {
    // Find the PayPal account for this tracking ID (organization ID)
    const accounts = await db.select().from(paypalAccounts);
    const existingAccount = accounts.find(
      (account) => account.orgId === trackingId,
    );

    if (existingAccount) {
      // Update existing account
      await db
        .update(paypalAccounts)
        .set({
          merchantId: merchantIdInPayPal,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(paypalAccounts.id, existingAccount.id));
    } else {
      // Create new account
      await db.insert(paypalAccounts).values({
        id: crypto.randomUUID(),
        orgId: trackingId,
        merchantId: merchantIdInPayPal,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        isLive: false,
        webhookId: null,
        credentials: null,
      });
    }

    // Redirect back to the app with the merchantId in URL params
    return NextResponse.redirect(
      `${url.origin}?merchantIdInPayPal=${merchantIdInPayPal}&merchantId=${trackingId}&permissionsGranted=true`,
    );
  } catch (error) {
    console.error("Error in PayPal onboarding:", error);
    return NextResponse.redirect(
      `${url.origin}?error=Failed to process PayPal onboarding`,
    );
  } finally {
    // Try to create webhook for the newly onboarded account
    // We do this in a finally block to ensure the user is redirected
    // even if webhook creation fails
    try {
      // Set up webhook for the merchant
      const webhookUrl = `${url.origin}/api/paypal/webhook`;

      // Only proceed if we have a valid trackingId
      if (trackingId) {
        const webhook = await setupMerchantWebhook({
          orgId: trackingId,
          notificationUrl: webhookUrl,
        });

        console.log("Created webhook for merchant:", trackingId, webhook);
      }
    } catch (webhookError) {
      // Just log the error, don't interrupt the onboarding flow
      console.error("Failed to set up webhook for merchant:", webhookError);
    }
  }
}
