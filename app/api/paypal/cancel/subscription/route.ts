import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get("orgId");

    // Log cancelled subscription
    console.log(`Subscription cancelled for organization ${orgId}`);

    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Redirect to cancellation page
    return NextResponse.redirect(`${baseUrl}/subscription-cancelled`);
  } catch (error) {
    console.error("Error in subscription cancel handler:", error);

    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Redirect to error page
    return NextResponse.redirect(
      `${baseUrl}/error?message=subscription-cancel-error`,
    );
  }
}
