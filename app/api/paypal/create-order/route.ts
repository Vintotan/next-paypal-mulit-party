import { NextRequest, NextResponse } from "next/server";
import { createOrderWithPlatformFee } from "@/lib/paypal/multiparty";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, amount, platformFee, currency, description } = body;

    if (!orgId || !amount || !platformFee) {
      return NextResponse.json(
        { error: "Required fields: orgId, amount, platformFee" },
        { status: 400 },
      );
    }

    const order = await createOrderWithPlatformFee({
      orgId,
      amount,
      platformFee,
      currency,
      description,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to create PayPal order" },
      { status: 500 },
    );
  }
}
