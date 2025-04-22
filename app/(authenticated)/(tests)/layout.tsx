"use client";

import { TRPCProvider } from "@/lib/trpc/provider";
import Link from "next/link";
import { useEffect } from "react";
import { UserMenu } from "@/components/ui/user-menu";

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
            <Link href="/" className="font-semibold text-md">
              PayPal Multi-Party
            </Link>

            <UserMenu />
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </TRPCProvider>
  );
}
