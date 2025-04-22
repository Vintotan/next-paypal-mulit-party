"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export function ClerkStatus() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [windowClerk, setWindowClerk] = useState<boolean>(false);

  useEffect(() => {
    // @ts-expect-error - Check if Clerk exists on window
    setWindowClerk(typeof window !== "undefined" && !!window.Clerk);

    console.log("[ClerkStatus] Component mounting with status:", {
      isLoaded,
      isSignedIn,
      userId: user?.id,
      // @ts-expect-error - Check if Clerk exists on window
      windowClerk: typeof window !== "undefined" && !!window.Clerk,
    });
  }, [isLoaded, isSignedIn, user]);

  return (
    <div className="p-4 border rounded shadow-lg text-sm z-50 max-w-xs bg-card">
      <h4 className="font-bold mb-2">Clerk Status</h4>
      <ul className="space-y-1">
        <li>
          <span className="font-medium">isLoaded:</span>{" "}
          <span className={isLoaded ? "text-green-600" : "text-red-600"}>
            {String(isLoaded)}
          </span>
        </li>
        <li>
          <span className="font-medium">isSignedIn:</span>{" "}
          <span className={isSignedIn ? "text-green-600" : "text-red-600"}>
            {String(isSignedIn)}
          </span>
        </li>
        <li>
          <span className="font-medium">Clerk on window:</span>{" "}
          <span className={windowClerk ? "text-green-600" : "text-red-600"}>
            {String(windowClerk)}
          </span>
        </li>
      </ul>
    </div>
  );
}
