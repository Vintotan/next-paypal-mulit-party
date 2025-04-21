"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { env } from "@/app/env";

export function EnvDebug() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-4 rounded-lg border bg-slate-50 my-4">
      <h3 className="font-bold mb-2">Environment Debug</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:</div>
        <div>
          {env.clerk.publishableKey ? (
            `${env.clerk.publishableKey.substring(0, 6)}...`
          ) : (
            <span className="text-red-500">Missing</span>
          )}
        </div>

        <div>CLERK_SECRET_KEY:</div>
        <div>
          {env.clerk.secretKey ? (
            <span className="text-green-500">Set</span>
          ) : (
            <span className="text-red-500">Missing</span>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => {
          setShowDetails(!showDetails);
          console.log("Environment variables:", {
            publishableKey: env.clerk.publishableKey,
            secretKey: env.clerk.secretKey ? "[REDACTED]" : null,
            signInUrl: env.clerk.signInUrl,
            signUpUrl: env.clerk.signUpUrl,
            afterSignInUrl: env.clerk.afterSignInUrl,
            afterSignUpUrl: env.clerk.afterSignUpUrl,
          });
        }}
      >
        {showDetails ? "Hide Details" : "Log Details"}
      </Button>

      {showDetails && (
        <div className="mt-2 p-2 bg-slate-100 rounded text-xs">
          <p>Check your browser console for detailed information.</p>
        </div>
      )}
    </div>
  );
}
