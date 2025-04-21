"use client";

import { useEffect, useState } from "react";

// Check if Clerk is available on window
export function useClerkInitCheck() {
  const [status, setStatus] = useState<{
    isInitialized: boolean;
    error: string | null;
  }>({
    isInitialized: false,
    error: null,
  });

  useEffect(() => {
    // Check immediately
    checkClerk();

    // Check again after a delay
    const timer = setTimeout(checkClerk, 2000);

    function checkClerk() {
      try {
        // @ts-expect-error - Check if Clerk exists on window
        const isAvailable = typeof window !== "undefined" && !!window.Clerk;

        setStatus({
          isInitialized: isAvailable,
          error: isAvailable ? null : "Clerk is not initialized on window",
        });

        console.log(
          "[Clerk Init Check]",
          isAvailable
            ? "Clerk is initialized on window"
            : "Clerk is not initialized on window",
        );
      } catch (err) {
        setStatus({
          isInitialized: false,
          error:
            err instanceof Error ? err.message : "Unknown error checking Clerk",
        });
      }
    }

    return () => clearTimeout(timer);
  }, []);

  return status;
}
