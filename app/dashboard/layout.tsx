"use client";

import { ClerkLoading, UserButton } from "@clerk/nextjs";
import { TRPCProvider } from "@/lib/trpc/provider";
import Link from "next/link";
import { useEffect } from "react";
import { OrganizationSwitcher } from "@/components/clerk/OrganizationSwitcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add a console log to confirm layout renders
  useEffect(() => {
    console.log("[Clerk Debug] Dashboard layout mounted");
    console.log(
      "[Clerk Debug] Checking if Clerk is available:",
      typeof window !== "undefined" && !!(window as any).Clerk,
    );
  }, []);

  return (
    <TRPCProvider>
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-white">
          <div className="container mx-auto py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center">
              <h2 className="font-semibold text-lg">
                PayPal Multi-Party Dashboard
              </h2>
            </div>

            <ClerkLoading>
              <div className="animate-pulse bg-slate-200 h-8 w-32 rounded"></div>
            </ClerkLoading>

            {/* Organization Switcher */}
            <OrganizationSwitcher />

            <div className="flex items-center gap-4">
              <nav className="flex gap-4">
                <Link href="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
              </nav>

              <UserButton
                appearance={{
                  elements: {
                    rootBox: "flex",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </TRPCProvider>
  );
}
