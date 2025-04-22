import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProviderWrapper } from "@/components/providers/clerk-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
// Import the environment configuration to ensure it's loaded
import { env } from "./env";
// Add the debug component
import { ClerkStatus } from "@/components/debug/ClerkStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PayPal Multi-Party Platform",
  description: "Multi-tenant platform with PayPal Multi-party support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Log the availability of Clerk keys
  console.log("[RootLayout] Clerk keys available:", {
    publishableKey: !!env.clerk.publishableKey,
    secretKey: !!env.clerk.secretKey,
  });

  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>PayPal Multi-Party Platform</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ClerkProviderWrapper>{children}</ClerkProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
