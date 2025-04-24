"use client";

import { TRPCProvider } from "@/lib/trpc/provider";
import Link from "next/link";
import { UserMenu } from "@/components/ui/user-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
