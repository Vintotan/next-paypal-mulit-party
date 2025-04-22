"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn
        appearance={{
          baseTheme: resolvedTheme === "dark" ? dark : undefined,
          elements: {
            rootBox: "mx-auto w-full max-w-md",
            card: "shadow-lg rounded-lg border border-gray-200 dark:border-gray-700",
          },
        }}
      />
    </div>
  );
}
