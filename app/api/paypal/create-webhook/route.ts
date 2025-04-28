import { NextRequest, NextResponse } from "next/server";
import { setupMerchantWebhook } from "@/lib/paypal/multiparty";
import { db } from "@/db";
import { paypalAccounts } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    // This endpoint could be protected with authentication in production
    // For now, we'll assume it's only called from authorized sources

    const { orgId, notificationUrl } = await req.json();

    if (!orgId || !notificationUrl) {
      return NextResponse.json(
        { error: "Missing required parameters: orgId and notificationUrl" },
        { status: 400 },
      );
    }

    // Check if organization exists
    const accounts = await db.select().from(paypalAccounts);
    const existingAccount = accounts.find((account) => account.orgId === orgId);

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Organization not found or does not have a PayPal account" },
        { status: 404 },
      );
    }

    // Setup the webhook
    const webhook = await setupMerchantWebhook({
      orgId,
      notificationUrl,
    });

    return NextResponse.json({
      success: true,
      webhook,
    });
  } catch (error) {
    console.error("Error creating PayPal webhook:", error);

    let errorMessage = "Failed to create PayPal webhook";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
