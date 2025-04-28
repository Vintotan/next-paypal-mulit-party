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

  useEffect(() => {
    if (organization) {
      checkConnectedAccount();
    }
  }, [organization, checkConnectedAccount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const merchantIdInPayPal = url.searchParams.get("merchantIdInPayPal");
    const permissionsGranted = url.searchParams.get("permissionsGranted");
    const trackingId = url.searchParams.get("merchantId");

    if (merchantIdInPayPal && permissionsGranted === "true" && organization) {
      (async () => {
        setLoading(true);
        try {
          await trpc.paypal.connectAccount.mutate({
            orgId: organization.id,
            merchantId: merchantIdInPayPal,
          });

          setSuccess(true);
          setMerchantId(merchantIdInPayPal);
          if (onSuccess) {
            onSuccess();
          }

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
      const trackingId = organization.id;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const returnUrl = `${baseUrl}/api/paypal/onboard`;

      const paypalUrl = new URL(
        process.env.NEXT_PUBLIC_PAYPAL_CONNECT_URL || "",
      );

      paypalUrl.searchParams.append("partnerId", PAYPAL_PARTNER_ID);
      paypalUrl.searchParams.append("merchantId", trackingId);
      paypalUrl.searchParams.append("product", "ppcp");
      paypalUrl.searchParams.append("integrationType", "TO");
      paypalUrl.searchParams.append("features", "PAYMENT,REFUND");
      paypalUrl.searchParams.append("returnToPartnerUrl", returnUrl);

      window.location.href = paypalUrl.toString();
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
          <Alert className="bg-green-500/10 border-green-500">
            <AlertTitle className="text-green-500">Success</AlertTitle>
            <AlertDescription className="text-green-500">
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
        <Alert className="bg-blue-500/10 border-blue-500">
          <AlertTitle className="text-blue-500">
            PayPal Business required
          </AlertTitle>
          <AlertDescription className={cn("text-blue-500")}>
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
                "text-xs bg-blue-500 text-white mt-2 w-fit mx-auto",
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
          <Alert className="bg-blue-500/10 border-blue-500">
            <AlertTitle className="text-blue-500">
              Organization Required
            </AlertTitle>
            <AlertDescription className="text-blue-500">
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
                  className="text-xs text-blue-500 hover:text-blue-800 flex items-center"
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
