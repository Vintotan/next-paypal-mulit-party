"use client";

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
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
import { AlertCircle, CheckCircle2, InfoIcon } from "lucide-react";
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

type ConnectPayPalProps = {
  onSuccess?: () => void;
};

export function ConnectPayPal({ onSuccess }: ConnectPayPalProps) {
  const { organization, isLoaded: orgIsLoaded } = useOrganization();
  const [merchantId, setMerchantId] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);

  // Check if there's a connected account when component mounts
  const checkConnectedAccount = useCallback(async () => {
    if (!organization) return;

    setIsCheckingAccount(true);
    setError(null);

    try {
      const account = await trpc.paypal.getConnectedAccount.query({
        orgId: organization.id,
      });

      if (account && account.status === "active") {
        setSuccess(true);
        setMerchantId(account.merchantId || "");
        setEmail(account.email || "");
        setBusinessName(account.businessName || "");
        console.log("PayPal account found and active", { account });
      } else {
        // Explicitly set success to false if no active account is found
        setSuccess(false);
        console.log("No active PayPal account found");
      }
    } catch (err) {
      console.error("Error checking account status:", err);
      // Ensure success is set to false on error
      setSuccess(false);
    } finally {
      setIsCheckingAccount(false);
    }
  }, [organization]);

  // Check for connected account when organization changes
  useEffect(() => {
    if (organization) {
      checkConnectedAccount();
    } else {
      // Reset the state when no organization is selected
      setSuccess(false);
      setMerchantId("");
      setEmail("");
      setBusinessName("");
    }
  }, [organization, checkConnectedAccount]);

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

  // Debug logging for connection state
  useEffect(() => {
    console.log("PayPal connection state:", {
      success,
      loading,
      isCheckingAccount,
      organizationId: organization?.id,
      merchantId,
    });
  }, [success, loading, isCheckingAccount, organization, merchantId]);

  const handleConnect = async () => {
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
      // Call the onSuccess callback to refresh dependent components
      if (onSuccess) {
        onSuccess();
        console.log(
          "[PayPal Debug] Called onSuccess callback after connecting account",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect PayPal account",
      );
    } finally {
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
      // Call the onSuccess callback to refresh dependent components
      if (onSuccess) {
        onSuccess();
        console.log(
          "[PayPal Debug] Called onSuccess callback after disconnecting account",
        );
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

  const isButtonDisabled =
    loading || isCheckingAccount || (!merchantId && !success) || !organization;
  const buttonTooltip = !organization
    ? "Select an organization first"
    : isCheckingAccount
      ? "Checking account status..."
      : !merchantId && !success
        ? "Enter a merchant ID"
        : loading
          ? "Connection in progress"
          : "";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {success ? "PayPal Account Connected" : "Connect PayPal Account"}
        </CardTitle>
        <CardDescription>
          {success
            ? "Your PayPal merchant account is connected and ready to process payments"
            : "Connect your PayPal merchant account to enable checkout for your customers"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Connected</AlertTitle>
            <AlertDescription className="text-green-700">
              PayPal account successfully connected!
            </AlertDescription>
          </Alert>
        )}

        {!organization && orgIsLoaded && (
          <Alert className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">
              Organization Required
            </AlertTitle>
            <AlertDescription className="text-blue-700">
              Please select an organization using the selector above before
              connecting a PayPal account.
            </AlertDescription>
          </Alert>
        )}

        {!success && !isCheckingAccount && (
          <>
            <div className="space-y-2">
              <Label htmlFor="merchantId">PayPal Merchant ID</Label>
              <Input
                id="merchantId"
                value={merchantId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMerchantId(e.target.value)
                }
                placeholder="Enter your PayPal Merchant ID"
                disabled={
                  loading || success || !organization || isCheckingAccount
                }
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
                disabled={
                  loading || success || !organization || isCheckingAccount
                }
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
                disabled={
                  loading || success || !organization || isCheckingAccount
                }
              />
            </div>
          </>
        )}

        {success && (
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
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {isCheckingAccount ? (
          <Button disabled className="w-full">
            Checking account status...
          </Button>
        ) : success ? (
          <>
            <Button
              variant="destructive"
              onClick={() => setDisconnectDialogOpen(true)}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processing..." : "Disconnect PayPal Account"}
            </Button>
            <AlertDialog
              open={disconnectDialogOpen}
              onOpenChange={setDisconnectDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect PayPal Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to disconnect your PayPal account?
                    This will prevent any future payments from being processed
                    through this account.
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
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isButtonDisabled}
            className="w-full"
            title={buttonTooltip}
          >
            {loading ? "Connecting..." : "Connect PayPal Account"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
