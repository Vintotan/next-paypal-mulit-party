"use client";

import { useState, useEffect } from "react";
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

  const isButtonDisabled = loading || success || !merchantId || !organization;
  const buttonTooltip = !organization
    ? "Select an organization first"
    : !merchantId
      ? "Enter a merchant ID"
      : loading
        ? "Connection in progress"
        : success
          ? "Already connected"
          : "";

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
            <AlertTitle className="text-green-800">Success</AlertTitle>
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

        <div className="space-y-2">
          <Label htmlFor="merchantId">PayPal Merchant ID</Label>
          <Input
            id="merchantId"
            value={merchantId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMerchantId(e.target.value)
            }
            placeholder="Enter your PayPal Merchant ID"
            disabled={loading || success || !organization}
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
            disabled={loading || success || !organization}
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
            disabled={loading || success || !organization}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col">
        <Button
          onClick={handleConnect}
          disabled={isButtonDisabled}
          className="w-full"
          title={buttonTooltip}
        >
          {loading
            ? "Connecting..."
            : success
              ? "Connected"
              : "Connect PayPal Account"}
        </Button>

        {isButtonDisabled && buttonTooltip && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            {buttonTooltip}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
