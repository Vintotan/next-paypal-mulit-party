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

type PayPalCheckoutProps = {
  amount: string;
  platformFee: string;
  currency?: string;
  description?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
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
  const [connectedAccount, setConnectedAccount] = useState<any>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  // Check if organization has a connected PayPal account
  const checkConnectedAccount = useCallback(async () => {
    if (!organization?.id) return;

    setAccountLoading(true);
    try {
      const response = await fetch(
        `/api/paypal/connected-account?orgId=${organization.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setConnectedAccount(data);
      }
    } catch (err) {
      console.error("Failed to fetch connected account:", err);
    } finally {
      setAccountLoading(false);
    }
  }, [organization?.id]);

  // Call this when the component mounts
  useEffect(() => {
    checkConnectedAccount();
  }, [organization?.id, checkConnectedAccount]);

  const handleCreateOrder = async () => {
    if (!organization?.id) {
      setError("No organization selected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Create order with platform fee
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgId: organization.id,
          amount,
          platformFee,
          currency,
          description,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Try to extract detailed error message from the response
        let errorMsg = "Failed to create order";
        if (responseData.error) {
          errorMsg = responseData.error;
          console.error("Order creation error:", responseData);
        }
        throw new Error(errorMsg);
      }

      setOrderId(responseData.id);
      return responseData.id;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create order";
      setError(errorMessage);
      if (onError) onError(err);
      return null;
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
        },
        body: JSON.stringify({
          orgId: organization.id,
          orderId: data.orderID,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Try to extract detailed error message from the response
        let errorMsg = "Failed to capture payment";
        if (responseData.error) {
          errorMsg = responseData.error;
          console.error("Payment capture error:", responseData);
        }
        throw new Error(errorMsg);
      }

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
          <Alert className="bg-green-600/30 border-green-600">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              Payment Successful
            </AlertTitle>
            <AlertDescription className="text-green-700">
              Your payment has been processed successfully!
            </AlertDescription>
          </Alert>
        )}

        {accountLoading && <p>Loading account information...</p>}

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
