import { NextRequest, NextResponse } from "next/server";
import { captureOrder } from "@/lib/paypal/multiparty";
import { db } from "@/db";
import { transactions, paypalAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Define a type for the PayPal capture result
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

    // Record the transaction in the database
    try {
      // Find the PayPal account for this organization
      const accounts = await db
        .select()
        .from(paypalAccounts)
        .where(eq(paypalAccounts.orgId, orgId));

      if (accounts && accounts.length > 0) {
        const paypalAccountId = accounts[0].id;

        // Get transaction details from the capture result
        const captureId = result.id;
        const purchaseUnit = result.purchase_units?.[0];
        const capture = purchaseUnit?.payments?.captures?.[0];

        if (capture) {
          // Extract data from the capture
          const amount = capture.amount.value;
          const currency = capture.amount.currency_code;
          const status = capture.status;

          // Calculate platform fee if available
          const platformFee =
            purchaseUnit?.payment_instruction?.platform_fees?.[0]?.amount
              ?.value || "0.00";

          // Get buyer email from multiple possible locations
          const buyerEmail =
            // First check payer.email_address (top level)
            result.payer?.email_address ||
            // Then check payment_source.paypal.email_address
            result.payment_source?.paypal?.email_address ||
            // Finally check the capture.payer if available (legacy location)
            capture.payer?.email_address;

          // Insert transaction record
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
      // We don't want to fail the capture if recording the transaction fails
      console.error("Error recording transaction:", dbError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error capturing PayPal order:", error);

    // Extract more detailed error information
    let errorMessage = "Failed to capture PayPal order";
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
