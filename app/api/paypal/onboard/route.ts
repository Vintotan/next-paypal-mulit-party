// app/api/paypal/onboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import paypalClient from "@/lib/paypal/client";

export async function POST(req: NextRequest) {
  const request = new paypalClient.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    // build out referral body
  });

  try {
    const response = await paypalClient.execute(request);
    return NextResponse.json(response.result);
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
