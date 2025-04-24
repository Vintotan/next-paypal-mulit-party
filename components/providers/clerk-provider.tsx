"use client";

import { ClerkProvider, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  // Get publishable key from environment
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Add global event listener for Clerk errors
  useEffect(() => {
    // Output debug information on mount
    console.log(
      "[ClerkProviderWrapper] Initializing with publishableKey:",
      !!publishableKey,
    );

    const handleClerkError = (event: ErrorEvent) => {
      console.error("Clerk error:", event.error);
      if (event.error && event.error.toString().includes("Clerk")) {
        setError(`Clerk error: ${event.error.toString()}`);
        setLoadState("error");
      }
    };

    window.addEventListener("error", handleClerkError);
    return () => window.removeEventListener("error", handleClerkError);
  }, [publishableKey]);

  // Log when components render
  useEffect(() => {
    if (loadState === "loaded") {
      console.log("[ClerkProviderWrapper] Clerk loaded successfully");
    }
  }, [loadState]);

  // Early return for missing publishable key, but after all hooks are called
  if (!publishableKey) {
    console.error("Missing Clerk publishable key");
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">Error: Missing Clerk publishable key</p>
        <p className="text-sm text-red-600 mt-1">
          Make sure your environment variables are properly set.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "12px",
            borderRadius: "6px",
            zIndex: 9999,
            maxWidth: "400px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <p>
            <strong>Clerk Error:</strong>
          </p>
          <p>{error}</p>
        </div>
      )}
      <ClerkProvider
        publishableKey={publishableKey}
        appearance={{
          baseTheme: resolvedTheme === "dark" ? dark : undefined,
          layout: {
            logoPlacement: "inside",
            logoImageUrl: "https://clerk.com/logo.png",
            showOptionalFields: true,
            socialButtonsPlacement: "bottom",
            socialButtonsVariant: "iconButton",
          },
          variables: {
            colorPrimary: "#0f172a",
            colorTextOnPrimaryBackground: "white",
          },
          elements: {
            rootBox: {
              width: "100%",
            },
            card: {
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            },
            organizationSwitcherTrigger: {
              width: "100%",
              padding: "8px",
              borderRadius: "0.375rem",
            },
          },
        }}
        navigate={(to) => (window.location.href = to)}
      >
        <ClerkLoading>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              padding: "8px",
              background: "#eef2ff",
              color: "#4f46e5",
              zIndex: 100,
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            Loading Clerk authentication...
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          {/* When ClerkLoaded renders, it means Clerk has loaded successfully */}
          {children}
        </ClerkLoaded>
      </ClerkProvider>
    </>
  );
}
