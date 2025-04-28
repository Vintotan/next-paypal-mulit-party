import { NextRequest, NextResponse } from "next/server";
import { captureOrder } from "@/lib/paypal/multiparty";
import { db } from "@/db";
import { transactions, paypalAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

type PayPalCaptureResult = {
  id: string;
  status: string;
  payment_source?: {
    paypal?: {
      email_address?: string;
    };
  };
  payer?: {
    email_address?: string;
  };
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          value: string;
          currency_code: string;
        };
        payer?: {
          email_address?: string;
        };
      }>;
    };
    payment_instruction?: {
      platform_fees?: Array<{
        amount: {
          value: string;
        };
      }>;
    };
  }>;
};

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

    const result = (await captureOrder({
      orgId,
      orderId,
    })) as PayPalCaptureResult;

    try {
      const accounts = await db
        .select()
        .from(paypalAccounts)
        .where(eq(paypalAccounts.orgId, orgId));

      if (accounts && accounts.length > 0) {
        const paypalAccountId = accounts[0].id;
        const captureId = result.id;
        const purchaseUnit = result.purchase_units?.[0];
        const capture = purchaseUnit?.payments?.captures?.[0];

        if (capture) {
          const amount = capture.amount.value;
          const currency = capture.amount.currency_code;
          const status = capture.status;
          const platformFee =
            purchaseUnit?.payment_instruction?.platform_fees?.[0]?.amount
              ?.value || "0.00";
          const buyerEmail =
            result.payer?.email_address ||
            result.payment_source?.paypal?.email_address ||
            capture.payer?.email_address;

          await db.insert(transactions).values({
            paypalAccountId,
            orderId,
            amount,
            currency,
            status,
            platformFee,
            buyerEmail,
            paymentDetails: result,
          });
        }
      }
    } catch (dbError) {
      console.error("Error recording transaction:", dbError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error capturing PayPal order:", error);

    let errorMessage = "Failed to capture PayPal order";
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
