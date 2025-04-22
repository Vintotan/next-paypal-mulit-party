import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Paypal, StreamifyLogo } from "@/components/ui/icones";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-12 mb-12">
            <Paypal className="h-12" />
            <span className="text-2xl font-bold tracking-tight">X</span>
            <StreamifyLogo className="h-12 text-[#B21064]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl mb-6">
            Multi-Party Implementation
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-muted-foreground">
            Create a multi-tenant platform with PayPal Multi-party payments
            integration, allowing your users to connect their PayPal accounts
            and receive payments.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({
                  variant: "default",
                  size: "lg",
                }),
              )}
            >
              Dashboard
            </Link>
            <Link
              href="https://developer.paypal.com/docs/multiparty/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "lg",
                }),
              )}
            >
              PayPal Documentation
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* One-Time Payment Card */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">One-Time Payments</CardTitle>
              </div>
              <CardDescription>
                Process immediate one-time payments through PayPal
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Secure payment processing with PayPal</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Multi-party payment distribution</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Pay with credit card or PayPal balance</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Instant confirmation</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link
                  href="/paypal-test?tab=oneTime"
                  className="flex items-center justify-center"
                >
                  Try One-Time Payment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Subscription Card */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Subscriptions</CardTitle>
              </div>
              <CardDescription>
                Set up recurring subscription payments with PayPal
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Recurring billing on flexible schedules</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Trial periods and promotional pricing</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Customer subscription management</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Automatic payment collection</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link
                  href="/paypal-test?tab=subscription"
                  className="flex items-center justify-center"
                >
                  Try Subscription
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
