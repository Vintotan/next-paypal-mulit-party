import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getPayPalAccessToken } from "@/lib/paypal";

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Fetch plans from PayPal
    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/billing/plans?page_size=20&page=1&total_required=true&status=ACTIVE`,
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
        { error: "Failed to fetch plans from PayPal" },
        { status: response.status },
      );
    }

    const plansData = await response.json();

    // Format the plans for our frontend
    const formattedPlans = await Promise.all(
      plansData.plans.map(async (plan: any) => {
        // Fetch detailed plan info for each plan to get pricing
        const detailResponse = await fetch(
          `${process.env.PAYPAL_API_URL}/v1/billing/plans/${plan.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!detailResponse.ok) {
          console.error(`Failed to fetch details for plan ${plan.id}`);
          return null;
        }

        const planDetails = await detailResponse.json();

        // Find the regular billing cycle to get price and interval
        const regularCycle = planDetails.billing_cycles.find(
          (cycle: any) => cycle.tenure_type === "REGULAR",
        );

        if (!regularCycle) return null;

        const price = regularCycle.pricing_scheme.fixed_price.value;
        const intervalUnit = regularCycle.frequency.interval_unit.toLowerCase();

        return {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: price,
          interval: intervalUnit,
        };
      }),
    );

    // Filter out any null values from failed detail fetches
    const validPlans = formattedPlans.filter((plan) => plan !== null);

    return NextResponse.json({
      success: true,
      plans: validPlans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
