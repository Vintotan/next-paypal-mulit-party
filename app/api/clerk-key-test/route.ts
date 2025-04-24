import { NextResponse } from "next/server";

// This is a test endpoint to check Clerk keys - DO NOT USE IN PRODUCTION
export async function GET() {
  // Mask the keys for security
  const maskKey = (key: string | undefined) => {
    if (!key) return null;
    if (key.length <= 10) return key.substring(0, 3) + "***";
    return key.substring(0, 6) + "..." + key.substring(key.length - 4);
  };

  // Check required environment variables
  const result = {
    clerk: {
      publishableKey: {
        exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        value: maskKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
        length: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length || 0,
        format:
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_") ||
          false,
      },
      secretKey: {
        exists: !!process.env.CLERK_SECRET_KEY,
        value: maskKey(process.env.CLERK_SECRET_KEY),
        length: process.env.CLERK_SECRET_KEY?.length || 0,
        format: process.env.CLERK_SECRET_KEY?.startsWith("sk_") || false,
      },
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
      afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    },
    processEnvCheck: {
      publishableKey: {
        exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        value: maskKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
        length: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length || 0,
      },
      secretKey: {
        exists: !!process.env.CLERK_SECRET_KEY,
        value: maskKey(process.env.CLERK_SECRET_KEY),
        length: process.env.CLERK_SECRET_KEY?.length || 0,
      },
    },
  };

  return NextResponse.json(result);
}
