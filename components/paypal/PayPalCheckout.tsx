"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganization } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Spinner } from "@/components/ui/spinner";

type PayPalCheckoutProps = {
  amount: string;
  platformFee: string;
  currency?: string;
  description?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
};

type ConnectedAccount = {
  id: string;
  status: string;
  merchantId: string;
  email?: string;
  businessName?: string;
};

type PayPalOrderResponse = {
  id: string;
  status: string;
};

export function PayPalCheckout({
  amount,
  platformFee,
  currency = "USD",
  description = "Purchase",
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] =
    useState<ConnectedAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  // Check if organization has a connected PayPal account
  const checkConnectedAccount = useCallback(async () => {
    if (!organization?.id) return;

    setAccountLoading(true);
    try {
      const response = await fetch(
        `/api/paypal/connected-account?orgId=${organization.id}`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );

      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error("Failed to fetch connected account");
        }
        return;
      }

      const data = await response.json();
      setConnectedAccount(data);
    } catch (err) {
      console.error("Failed to fetch connected account:", err);
      setConnectedAccount(null);
    } finally {
      setAccountLoading(false);
    }
  }, [organization?.id]);

  // Call this when the component mounts
  useEffect(() => {
    checkConnectedAccount();
  }, [organization?.id, checkConnectedAccount]);

  const handleCreateOrder = async (): Promise<string> => {
    if (!organization?.id) {
      setError("No organization selected");
      return Promise.reject("No organization selected");
    }

    setLoading(true);
    setError(null);

    try {
      // Create order with platform fee
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          orgId: organization.id,
          amount,
          platformFee,
          currency,
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const responseData: PayPalOrderResponse = await response.json();
      setOrderId(responseData.id);
      return responseData.id;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create order";
      setError(errorMessage);
      if (onError) onError(err);
      return Promise.reject(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (data: any) => {
    if (!organization?.id || !data.orderID) {
      setError("Missing organization or order information");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Capture the funds
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          orgId: organization.id,
          orderId: data.orderID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to capture payment");
      }

      const responseData = await response.json();
      setSuccess(true);
      if (onSuccess) onSuccess(responseData);
      return responseData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to capture payment";
      setError(errorMessage);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Check if the account is connected and ready
  const isAccountConnected = connectedAccount?.status === "active";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        <CardDescription>
          {isAccountConnected
            ? `Pay securely with PayPal - ${amount} ${currency}`
            : "PayPal account not connected"}
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
          <Alert className="bg-green-600/10 border-green-600">
            <AlertTitle className="text-green-700">
              Payment Successful
            </AlertTitle>
            <AlertDescription className="text-green-700">
              Your payment has been processed successfully!
            </AlertDescription>
          </Alert>
        )}

        {accountLoading && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}

        {!isAccountConnected && !accountLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Not Connected</AlertTitle>
            <AlertDescription>
              The organization needs to connect a PayPal account before
              accepting payments.
            </AlertDescription>
          </Alert>
        )}

        {isAccountConnected && !success && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">
                {amount} {currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee:</span>
              <span className="font-medium">
                {platformFee} {currency}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Total:</span>
              <span className="font-bold">
                {amount} {currency}
              </span>
            </div>

            <div className="mt-6">
              <PayPalScriptProvider
                options={{
                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                  currency: currency,
                }}
              >
                <div style={{ colorScheme: "none" }}>
                  <PayPalButtons
                    style={{
                      layout: "vertical",
                      tagline: false,
                    }}
                    fundingSource="paypal"
                    disabled={loading}
                    forceReRender={[amount, currency, platformFee]}
                    createOrder={handleCreateOrder}
                    onApprove={handleApprove}
                    onError={(err: any) => {
                      setError("Payment failed. Please try again.");
                      if (onError) onError(err);
                    }}
                  />
                </div>
              </PayPalScriptProvider>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
