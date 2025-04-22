import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paypalAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createPayPalClient } from "@/lib/paypal/client";

export async function GET(request: NextRequest) {
  try {
    // Get the organization ID from the query parameters
    const orgId = request.nextUrl.searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Find the PayPal account for this organization
    const accounts = await db
      .select()
      .from(paypalAccounts)
      .where(eq(paypalAccounts.orgId, orgId));

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No PayPal account found for this organization" },
        { status: 404 },
      );
    }

    const account = accounts[0];

    // Check if the account is inactive, treat as not found
    if (account.status !== "active") {
      return NextResponse.json(
        { error: "No active PayPal account found for this organization" },
        { status: 404 },
      );
    }

    // For security, we'll exclude sensitive credential information
    const sanitizedAccount = {
      id: account.id,
      orgId: account.orgId,
      merchantId: account.merchantId,
      email: account.email,
      businessName: account.businessName,
      status: account.status,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      isLive: account.isLive,
    };

    try {
      // If we have a merchantId, we can try to fetch more details from PayPal API
      // This is a placeholder for the actual API call to PayPal
      const client = createPayPalClient();

      // We would need the appropriate PayPal API endpoint to get merchant details
      // For now, we'll just return the basic account info from our database

      return NextResponse.json({
        account: sanitizedAccount,
        // We could add additional PayPal API information here in the future
      });
    } catch (apiError) {
      console.error(
        "Error fetching PayPal account details from API:",
        apiError,
      );

      // If the API call fails, still return the basic account info
      return NextResponse.json({
        account: sanitizedAccount,
        apiError: "Could not fetch details from PayPal API",
      });
    }
  } catch (error) {
    console.error("Error fetching PayPal account:", error);
    return NextResponse.json(
      { error: "Failed to fetch PayPal account details" },
      { status: 500 },
    );
  }
}
