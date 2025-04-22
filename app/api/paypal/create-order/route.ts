import { NextRequest, NextResponse } from "next/server";
import { createOrderWithPlatformFee } from "@/lib/paypal/multiparty";

// Define a type for the PayPal order result
type PayPalOrderResult = {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  // Add other fields as needed
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

    console.log("Creating PayPal order with:", {
      orgId,
      amount,
      platformFee,
      currency,
      description,
    });

    const order = (await createOrderWithPlatformFee({
      orgId,
      amount,
      platformFee,
      currency,
      description,
    })) as PayPalOrderResult;

    console.log("Order created successfully:", order.id);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating PayPal order:", error);

    // Extract more detailed error information
    let errorMessage = "Failed to create PayPal order";
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Try to parse PayPal API error details if available
      try {
        const errorJson = JSON.parse(error.message);
        if (errorJson.details) {
          errorDetails = errorJson.details;
        }
      } catch (e) {
        // Not a JSON error message, use as is
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
