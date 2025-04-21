import { NextResponse } from "next/server";
import { env } from "@/app/env";

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
        exists: !!env.clerk.publishableKey,
        value: maskKey(env.clerk.publishableKey),
        length: env.clerk.publishableKey?.length || 0,
        format: env.clerk.publishableKey?.startsWith("pk_") || false,
      },
      secretKey: {
        exists: !!env.clerk.secretKey,
        value: maskKey(env.clerk.secretKey),
        length: env.clerk.secretKey?.length || 0,
        format: env.clerk.secretKey?.startsWith("sk_") || false,
      },
      signInUrl: env.clerk.signInUrl,
      signUpUrl: env.clerk.signUpUrl,
      afterSignInUrl: env.clerk.afterSignInUrl,
      afterSignUpUrl: env.clerk.afterSignUpUrl,
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
