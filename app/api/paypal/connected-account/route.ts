import { db } from "@/db";
import { paypalAccounts } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orgId = searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json(
      { error: "Organization ID is required" },
      { status: 400 },
    );
  }

  try {
    const accounts = await db.select().from(paypalAccounts);
    const account = accounts.find((account) => account.orgId === orgId);

    if (!account) {
      return NextResponse.json(null, { status: 404 });
    }

    // Check if the account is active
    if (account.status !== "active") {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching connected account:", error);
    return NextResponse.json(
      { error: "Failed to fetch connected account" },
      { status: 500 },
    );
  }
}
