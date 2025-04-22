import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/paypal";

export async function GET(request: NextRequest) {
  try {
    // Get the plan ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 },
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Fetch plan details from PayPal
    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/billing/plans/${planId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PayPal API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get plan details from PayPal" },
        { status: response.status },
      );
    }

    const planDetails = await response.json();
    return NextResponse.json(planDetails);
  } catch (error) {
    console.error("Error fetching plan details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
