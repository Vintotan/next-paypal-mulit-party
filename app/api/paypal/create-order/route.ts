import { NextRequest, NextResponse } from "next/server";
import { createOrderWithPlatformFee } from "@/lib/paypal/multiparty";

type PayPalOrderResult = {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
};

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

    const order = (await createOrderWithPlatformFee({
      orgId,
      amount,
      platformFee,
      currency,
      description,
    })) as PayPalOrderResult;

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating PayPal order:", error);

    let errorMessage = "Failed to create PayPal order";
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;

      try {
        const errorJson = JSON.parse(error.message);
        if (errorJson.details) {
          errorDetails = errorJson.details;
        }
      } catch (e) {
        // Not a JSON error message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    );
  }
}
