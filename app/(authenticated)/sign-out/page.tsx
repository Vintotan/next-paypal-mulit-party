"use client";

import { useEffect } from "react";
import { SignOutButton, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  // Automatically sign out when this page loads
  useEffect(() => {
    const performSignOut = async () => {
      await signOut();
      router.push("/");
    };

    performSignOut();
  }, [signOut, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Signing out...</h1>
      <p className="mb-6">
        If you are not redirected automatically, click the button below:
      </p>
      <SignOutButton signOutCallback={() => router.push("/")}>
        <button className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors">
          Sign Out
        </button>
      </SignOutButton>
    </div>
  );
}
