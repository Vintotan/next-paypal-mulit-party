import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { paypalAccounts } from "@/db/schema";

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

    // First, find the PayPal account for this organization
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

    // Check if the account is active, if not return empty array
    if (account.status !== "active") {
      return NextResponse.json([]);
    }

    const paypalAccountId = account.id;

    // Fetch transactions for this PayPal account
    const results = await db
      .select()
      .from(transactions)
      .where(eq(transactions.paypalAccountId, paypalAccountId))
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching PayPal transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 },
    );
  }
}
