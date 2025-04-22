"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { env } from "@/app/env";

export function EnvDebug() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-4 rounded-lg border my-4 bg-card">
      <h3 className="font-bold mb-2">Environment Debug</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:</div>
        <div>
          {env.clerk.publishableKey ? (
            `${env.clerk.publishableKey}`
          ) : (
            <span className="text-red-500">Missing</span>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 p-2 rounded text-xs">
          <p>Check your browser console for detailed information.</p>
        </div>
      )}
    </div>
  );
}
