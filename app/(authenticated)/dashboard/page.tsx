"use client";

import { ConnectPayPal } from "@/components/paypal/ConnectPayPal";
import { PayPalCheckout } from "@/components/paypal/PayPalCheckout";
import { PayPalConnectionStatus } from "@/components/paypal/PayPalConnectionStatus";
import { PaymentHistory } from "@/components/paypal/PaymentHistory";
import { PayPalAccountDetails } from "@/components/paypal/PayPalAccountDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrganization, useClerk } from "@clerk/nextjs";
import { useEffect, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateOrganization } from "@/components/clerk/CreateOrganization";
import { EnvDebug } from "@/components/debug/EnvDebug";

// Dashboard content component that uses useSearchParams
function DashboardContent() {
  const { organization, isLoaded } = useOrganization();
  const clerk = useClerk();
  const searchParams = useSearchParams();
  const [paypalConnectionRefresh, setPaypalConnectionRefresh] = useState(0);

  // Debug state for component mounting
  useEffect(() => {
    console.log("[Clerk Debug] Dashboard page mounted");
    console.log("[Clerk Debug] Organization state:", {
      isLoaded,
      hasOrg: !!organization,
      orgId: organization?.id,
      orgName: organization?.name,
    });
    console.log("[Clerk Debug] Clerk object:", {
      loaded: clerk.loaded,
      userId: clerk.user?.id,
      sessionId: clerk.session?.id,
    });
  }, [isLoaded, organization, clerk]);

  // Handle the set_active_org parameter from middleware
  useEffect(() => {
    const setActiveOrg = async () => {
      const activeOrgParam = searchParams.get("set_active_org");

      if (activeOrgParam && clerk.loaded && !organization) {
        console.log(
          "[Clerk Debug] Setting active organization from URL param:",
          activeOrgParam,
        );

        try {
          await clerk.setActive({ organization: activeOrgParam });
          console.log("[Clerk Debug] Successfully set active organization");

          // Remove the parameter and reload
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("set_active_org");
          window.history.replaceState({}, "", newUrl.toString());
        } catch (error) {
          console.error(
            "[Clerk Debug] Error setting active organization:",
            error,
          );
        }
      }
    };

    setActiveOrg();
  }, [searchParams, clerk, organization]);

  // Handle PayPal connection updates
  const handlePayPalConnectionUpdate = () => {
    // Increment the refresh counter to trigger a rerender of dependent components
    setPaypalConnectionRefresh((prev) => prev + 1);
    console.log("[PayPal Debug] Connection status updated, triggering refresh");
  };

  // For debugging - show additional info in development
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isLoaded && !organization) {
    return (
      <main className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {isDevelopment && <EnvDebug />}

        <Alert className="mb-4">
          <AlertDescription>
            Please select an organization or create a new one to continue.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-8 my-8">
          <Card className="w-full h-full">
            <CardHeader>
              <CardTitle>Organization Required</CardTitle>
              <CardDescription>
                You need to select or create an organization to use the
                platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Use the organization switcher in the header to select an
                existing organization, or create a new one below.
              </p>
            </CardContent>
          </Card>

          <CreateOrganization />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <Tabs defaultValue="connect">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connect">Connect PayPal</TabsTrigger>
          <TabsTrigger value="checkout">Test Checkout</TabsTrigger>
        </TabsList>

        <TabsContent value="connect">
          <Card className="bg-background border-none shadow-none">
            <CardHeader>
              <div className="flex justify-center items-center">
                {organization && (
                  <PayPalConnectionStatus
                    key={`connection-status-${paypalConnectionRefresh}`}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ConnectPayPal onSuccess={handlePayPalConnectionUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkout" className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Test PayPal Checkout with Platform Fee</CardTitle>
                {organization && (
                  <PayPalConnectionStatus
                    key={`checkout-status-${paypalConnectionRefresh}`}
                  />
                )}
              </div>
              <CardDescription>
                Process a test payment with a platform fee included
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-foreground mb-4">
                  This example shows a payment of $100 with a $5 platform fee.
                  The seller receives $95 and the platform (you) receives $5.
                </p>
                <Separator className="my-4" />
                <PayPalCheckout
                  amount="100.00"
                  platformFee="5.00"
                  currency="USD"
                  description="Test purchase with platform fee"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Organization info */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Organization Status</CardTitle>
            {organization && (
              <PayPalConnectionStatus
                key={`org-status-${paypalConnectionRefresh}`}
              />
            )}
          </div>
          <CardDescription>
            {!isLoaded
              ? "Loading organization information..."
              : organization
                ? `Connected to ${organization.name}`
                : "No organization selected. Use the Organization Switcher in the header to select or create one."}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* PayPal Account Details Card */}
      <PayPalAccountDetails
        key={`account-details-${paypalConnectionRefresh}`}
      />

      {/* Transaction History Card */}
      <PaymentHistory key={`payment-history-${paypalConnectionRefresh}`} />
    </main>
  );
}

// Wrap the Dashboard content in Suspense
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10 px-4">Loading dashboard...</div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
