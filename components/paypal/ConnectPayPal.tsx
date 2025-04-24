"use client";

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganization } from "@clerk/nextjs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  InfoIcon,
  ExternalLink,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Replace this with your actual PayPal Partner ID
// For testing, you can obtain this from your PayPal Developer account
const PAYPAL_PARTNER_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

type ConnectPayPalProps = {
  onSuccess?: () => void;
};

export function ConnectPayPal({ onSuccess }: ConnectPayPalProps) {
  const router = useRouter();
  const { organization, isLoaded: orgIsLoaded } = useOrganization();
  const [merchantId, setMerchantId] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");

  // Check if there's a connected account when component mounts
  const checkConnectedAccount = useCallback(async () => {
    if (!organization) return;

    setIsCheckingAccount(true);
    try {
      const account = await trpc.paypal.getConnectedAccount.query({
        orgId: organization.id,
      });

      if (account && account.status === "active") {
        setSuccess(true);
        setMerchantId(account.merchantId || "");
        setEmail(account.email || "");
        setBusinessName(account.businessName || "");
      }
    } catch (err) {
      console.error("Error checking account status:", err);
    } finally {
      setIsCheckingAccount(false);
    }
  }, [organization]);

  // Check for connected account when organization changes
  useEffect(() => {
    if (organization) {
      checkConnectedAccount();
    }
  }, [organization, checkConnectedAccount]);

  // Check for PayPal onboarding return URL parameters
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const merchantIdInPayPal = url.searchParams.get("merchantIdInPayPal");
    const permissionsGranted = url.searchParams.get("permissionsGranted");
    const trackingId = url.searchParams.get("merchantId");

    // If we have PayPal return parameters
    if (merchantIdInPayPal && permissionsGranted === "true" && organization) {
      (async () => {
        setLoading(true);
        try {
          // Connect the PayPal account with the returned merchant ID
          await trpc.paypal.connectAccount.mutate({
            orgId: organization.id,
            merchantId: merchantIdInPayPal,
            // You could also store other returned parameters if needed
          });

          setSuccess(true);
          setMerchantId(merchantIdInPayPal);
          if (onSuccess) {
            onSuccess();
          }

          // Clear URL parameters to avoid processing again on refresh
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to connect PayPal account after onboarding",
          );
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [organization, onSuccess]);

  // Automatically show an informative message if no organization is selected
  useEffect(() => {
    if (orgIsLoaded && !organization && !error) {
      setError(
        "No organization selected. Please select an organization from the organization selector above.",
      );
    } else if (
      organization &&
      error ===
        "No organization selected. Please select an organization from the organization selector above."
    ) {
      setError(null);
    }
  }, [organization, orgIsLoaded, error]);

  const handleManualConnect = async () => {
    if (!organization) {
      setError(
        "No organization selected. Please select an organization from the organization selector above.",
      );
      return;
    }

    if (!merchantId) {
      setError("PayPal Merchant ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await trpc.paypal.connectAccount.mutate({
        orgId: organization.id,
        merchantId,
        email: email || undefined,
        businessName: businessName || undefined,
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect PayPal account",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDirectConnect = async () => {
    if (!organization) {
      setError(
        "No organization selected. Please select an organization from the organization selector above.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use PayPal's URL onboarding flow as per the documentation
      // Use the organization ID as the tracking ID
      const trackingId = organization.id;

      // Create the PayPal onboarding URL with proper parameters
      // This follows the URL onboarding format in the PayPal documentation
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const returnUrl = `${baseUrl}/api/paypal/onboard`;

      // Construct URL according to PayPal's URL onboarding spec
      const paypalUrl = new URL(
        process.env.NEXT_PUBLIC_PAYPAL_CONNECT_URL || "",
      );

      // Add query parameters
      paypalUrl.searchParams.append("partnerId", PAYPAL_PARTNER_ID);
      paypalUrl.searchParams.append("merchantId", trackingId); // Use org ID as tracking ID
      paypalUrl.searchParams.append("product", "ppcp"); // PayPal Commerce Platform
      paypalUrl.searchParams.append("integrationType", "TO"); // Third Party OAuth
      paypalUrl.searchParams.append("features", "PAYMENT,REFUND");
      paypalUrl.searchParams.append("returnToPartnerUrl", returnUrl);

      // For demo purposes we can also use the static token you provided
      // paypalUrl.searchParams.append("referralToken", "YzliYjA1MTUtNmI5Yy00NTQ4LWIyMGYtY2RhOTBiMjJkYmU4d2U1YlRZaFkreGlmZW9lVHdnc01PMUVtRmlNeUVGL0o3d2xXa015Ky9JYz12Mg==");

      // Redirect to PayPal URL onboarding flow
      window.location.href = paypalUrl.toString();

      // Note: The user will be redirected to PayPal. When they return via the return URL,
      // our API route will handle the connection
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate PayPal onboarding",
      );
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization) {
      setError(
        "No organization selected. Please select an organization from the organization selector above.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await trpc.paypal.disconnectAccount.mutate({
        orgId: organization.id,
      });

      setSuccess(false);
      setMerchantId("");
      setEmail("");
      setBusinessName("");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to disconnect PayPal account",
      );
    } finally {
      setLoading(false);
      setDisconnectDialogOpen(false);
    }
  };

  const isManualButtonDisabled =
    loading || isCheckingAccount || !merchantId || !organization;
  const isDirectButtonDisabled = loading || isCheckingAccount || !organization;

  const manualButtonTooltip = !organization
    ? "Select an organization first"
    : isCheckingAccount
      ? "Checking account status..."
      : !merchantId
        ? "Enter a merchant ID"
        : loading
          ? "Connection in progress"
          : "";

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connected PayPal Account</CardTitle>
          <CardDescription>
            Your PayPal account is successfully connected
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="bg-green-600/30 border-green-600">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              PayPal account successfully connected!
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Merchant ID:</span>
              <span>{merchantId}</span>
            </div>
            {email && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Email:</span>
                <span>{email}</span>
              </div>
            )}
            {businessName && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Business:</span>
                <span>{businessName}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            variant="destructive"
            onClick={() => setDisconnectDialogOpen(true)}
            disabled={loading || isCheckingAccount}
            className="w-full"
          >
            Disconnect PayPal Account
          </Button>
          <AlertDialog
            open={disconnectDialogOpen}
            onOpenChange={setDisconnectDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect PayPal Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to disconnect your PayPal account? This
                  will prevent any future payments from being processed through
                  this account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect PayPal Account</CardTitle>
        <CardDescription>
          Connect your PayPal merchant account to enable checkout for your
          customers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert className="bg-blue-700/30 border-blue-700">
          <AlertTitle className="text-blue-700 font-semibold">
            PayPal Business required
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            A PayPal business account is required to enable PayPal Checkout.
            Personal accounts are not supported.
            <Link
              href="https://www.paypal.com/business"
              target="_blank"
              className={cn(
                buttonVariants({
                  variant: "default",
                  size: "sm",
                }),
                "text-xs bg-blue-700 text-white mt-2 w-fit mx-auto",
              )}
            >
              Create PayPal Business
              <ExternalLink className="ml-1 h-2 w-2" />
            </Link>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!organization && orgIsLoaded && (
          <Alert className="bg-blue-700/30 border-blue-700">
            <InfoIcon className="h-4 w-4 text-blue-700" />
            <AlertTitle className="text-blue-700">
              Organization Required
            </AlertTitle>
            <AlertDescription className="text-blue-700">
              Please select an organization using the selector above before
              connecting a PayPal account.
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          defaultValue="manual"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1">
              Manual Connection
            </TabsTrigger>
            <TabsTrigger value="direct" className="flex-1">
              Quick Connect
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="merchantId">PayPal Merchant ID</Label>
                <Link
                  href="https://www.paypal.com/businessmanage/account/aboutBusiness"
                  target="_blank"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  Open PayPal Merchant ID{" "}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </div>
              <Input
                id="merchantId"
                value={merchantId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMerchantId(e.target.value)
                }
                placeholder="Enter your PayPal Merchant ID"
                disabled={loading || isCheckingAccount}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">PayPal Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your PayPal email"
                disabled={loading || isCheckingAccount}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name (Optional)</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBusinessName(e.target.value)
                }
                placeholder="Enter your business name"
                disabled={loading || isCheckingAccount}
              />
            </div>

            <Button
              onClick={handleManualConnect}
              disabled={isManualButtonDisabled}
              className="w-full"
              title={manualButtonTooltip}
            >
              {loading ? "Connecting..." : "Connect with Merchant ID"}
            </Button>
          </TabsContent>

          <TabsContent value="direct" className="space-y-4 pt-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-foreground">
                Connect your PayPal account directly using PayPal&apos;s
                onboarding flow. You&apos;ll be redirected to PayPal to complete
                the setup process.
              </p>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  This will create a secure connection between your PayPal
                  Business account and this platform, allowing us to process
                  payments on your behalf.
                </p>
              </div>

              <Button
                onClick={handleDirectConnect}
                disabled={isDirectButtonDisabled}
                className="w-full"
              >
                {loading ? "Connecting..." : "Connect with PayPal"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
