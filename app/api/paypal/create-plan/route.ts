import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createProduct, createSubscriptionPlan } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, price, interval, trialPrice, trialDuration } =
      await request.json();

    if (!name || !description || !price || !interval) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 },
      );
    }

    // Create a product first (required for creating a plan)
    const productData = await createProduct(name, description);

    // Define billing cycles based on input
    const billingCycles = [];

    // Add trial cycle if trial parameters are provided
    if (trialPrice && trialDuration) {
      billingCycles.push({
        frequency: {
          interval_unit: interval.toUpperCase(),
          interval_count: 1,
        },
        tenure_type: "TRIAL",
        sequence: 1,
        total_cycles: parseInt(trialDuration),
        pricing_scheme: {
          fixed_price: {
            value: trialPrice,
            currency_code: "USD",
          },
        },
      });
    }

    // Add regular billing cycle
    billingCycles.push({
      frequency: {
        interval_unit: interval.toUpperCase(),
        interval_count: 1,
      },
      tenure_type: "REGULAR",
      sequence: trialPrice && trialDuration ? 2 : 1,
      total_cycles: 0, // 0 means until cancelled
      pricing_scheme: {
        fixed_price: {
          value: price,
          currency_code: "USD",
        },
      },
    });

    // Define payment preferences
    const paymentPreferences = {
      auto_bill_outstanding: true,
      payment_failure_threshold: 3,
    };

    // Create the plan
    const planData = await createSubscriptionPlan(
      productData.id,
      name,
      description,
      billingCycles,
      paymentPreferences,
    );

    return NextResponse.json({
      success: true,
      plan: {
        id: planData.id,
        name: planData.name,
        description: planData.description,
        status: planData.status,
        price: price,
        interval: interval.toLowerCase(),
      },
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
