import { db } from "@/db";
import { transactions, paypalAccounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get orgId from query params
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Query the database to get the account for the organization
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

    // Query the database to get all transactions for the account, ordered by creation date
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.paypalAccountId, account.id))
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    // Format the response
    const formattedTransactions = result.map((tx) => {
      // Try to extract a meaningful description from paymentDetails
      let description = "-";
      if (tx.paymentDetails) {
        try {
          const details =
            typeof tx.paymentDetails === "string"
              ? JSON.parse(tx.paymentDetails)
              : tx.paymentDetails;

          if (
            details.purchase_units &&
            details.purchase_units[0]?.description
          ) {
            description = details.purchase_units[0].description;
          } else if (
            details.purchase_units &&
            details.purchase_units[0]?.items &&
            details.purchase_units[0].items.length > 0
          ) {
            description = details.purchase_units[0].items[0].name;
          }
        } catch (e) {
          // If JSON parsing fails, keep default description
          console.error(
            `Error parsing payment details for transaction ${tx.id}:`,
            e,
          );
        }
      }

      return {
        id: tx.id,
        orderId: tx.orderId,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        platformFee: tx.platformFee || "0.00",
        createdAt: tx.createdAt.toISOString(),
        buyerEmail: tx.buyerEmail || "-",
        paymentType: "ONE_TIME", // Add payment type field for one-time payments
        description: description,
      };
    });

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 },
    );
  }
}
