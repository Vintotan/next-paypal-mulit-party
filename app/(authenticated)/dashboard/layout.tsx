"use client";

import { ClerkLoading, UserButton } from "@clerk/nextjs";
import { TRPCProvider } from "@/lib/trpc/provider";
import Link from "next/link";
import { useEffect } from "react";
import { OrganizationSwitcher } from "@/components/clerk/OrganizationSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
        <header className="border-b">
          <div className="container mx-auto py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Link href="/dashboard" className="font-semibold text-md">
              PayPal Multi-Party
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <OrganizationSwitcher />
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
