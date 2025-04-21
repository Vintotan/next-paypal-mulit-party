import { NextRequest, NextResponse } from "next/server";
import { captureOrder } from "@/lib/paypal/multiparty";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, orderId } = body;

    if (!orgId || !orderId) {
      return NextResponse.json(
        { error: "Required fields: orgId, orderId" },
        { status: 400 },
      );
    }

    const result = await captureOrder({
      orgId,
      orderId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to capture PayPal order" },
      { status: 500 },
    );
  }
}
