"use client";

import { useUser } from "@clerk/nextjs";

export default function SimpleTest() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Simple Clerk Test</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(
            {
              isLoaded,
              isSignedIn,
              userId: user?.id,
              userEmail: user?.primaryEmailAddress?.emailAddress,
              windowClerk:
                typeof window !== "undefined"
                  ? // @ts-expect-error because Clerk is not defined in the window object
                    !!window.Clerk
                  : false,
              key: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
                ? "Set (first 6 chars: " +
                  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(
                    0,
                    6,
                  ) +
                  ")"
                : "Not set",
            },
            null,
            2,
          )}
        </pre>
        <div className="mt-4">
          <a href="/dashboard" className="text-blue-500 hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
