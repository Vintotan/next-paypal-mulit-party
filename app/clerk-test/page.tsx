"use client";

import {
  useUser,
  UserButton,
  SignInButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/app/env";
import { Suspense } from "react";
import { useClerkInitCheck } from "@/app/init-check";

function ClerkTestContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const clerkInit = useClerkInitCheck();

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Clerk Test Page</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
            </div>
            <div>
              {env.clerk.publishableKey ? (
                `${env.clerk.publishableKey.substring(0, 10)}...`
              ) : (
                <span className="text-red-500">Missing</span>
              )}
            </div>

            <div className="font-medium">Publishable Key Length:</div>
            <div>
              {env.clerk.publishableKey ? (
                env.clerk.publishableKey.length
              ) : (
                <span className="text-red-500">N/A</span>
              )}
            </div>

            <div className="font-medium">CLERK_SECRET_KEY:</div>
            <div>
              {env.clerk.secretKey ? (
                <span className="text-green-500">Set</span>
              ) : (
                <span className="text-red-500">Missing</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Clerk Initialization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Is Clerk initialized on window:</p>
              <p>
                {clerkInit.isInitialized ? (
                  <span className="text-green-500">Yes</span>
                ) : (
                  <span className="text-red-500">No</span>
                )}
              </p>
            </div>

            {clerkInit.error && (
              <div>
                <p className="font-medium">Error:</p>
                <p className="text-red-500">{clerkInit.error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Clerk Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="mb-2 font-medium">User State:</p>
              <div className="text-sm">
                <p>Is Loaded: {isLoaded ? "Yes" : "No"}</p>
                <p>Is Signed In: {isSignedIn ? "Yes" : "No"}</p>
                <p>User ID: {isSignedIn && user ? user.id : "Not signed in"}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium">Sign In Button:</p>
              <div className="border p-4 rounded">
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium">User Button:</p>
              <div className="border p-4 rounded">
                <UserButton />
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium">Organization Switcher:</p>
              <div className="border p-4 rounded">
                <OrganizationSwitcher />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <a href="/dashboard" className="text-blue-500 hover:underline">
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}

export default function ClerkTestPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-10">Loading Clerk test page...</div>
      }
    >
      <ClerkTestContent />
    </Suspense>
  );
}
