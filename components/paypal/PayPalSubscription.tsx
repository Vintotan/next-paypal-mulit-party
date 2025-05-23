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

type PayPalSubscriptionProps = {
  planId: string;
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

type PlanDetails = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  billing_cycles?: {
    tenure_type: string;
    frequency?: {
      interval_unit: string;
      interval_count?: number;
    };
    total_cycles?: number;
    pricing_scheme?: {
      fixed_price: {
        value: string;
        currency_code: string;
      };
    };
  }[];
};

export function PayPalSubscription({
  planId,
  description = "Subscription",
  onSuccess,
  onError,
}: PayPalSubscriptionProps) {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] =
    useState<ConnectedAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

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
        throw new Error("Failed to fetch connected account");
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

  // Fetch plan details
  const fetchPlanDetails = useCallback(async () => {
    if (!planId) return;

    setPlanLoading(true);
    try {
      const response = await fetch(
        `/api/paypal/plan-details?planId=${planId}`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch plan details");
      }

      const data = await response.json();
      setPlanDetails(data);
    } catch (err) {
      console.error("Failed to fetch plan details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch plan details",
      );
    } finally {
      setPlanLoading(false);
    }
  }, [planId]);

  // Call this when the component mounts
  useEffect(() => {
    checkConnectedAccount();
    fetchPlanDetails();
  }, [organization?.id, planId, checkConnectedAccount, fetchPlanDetails]);

  const handleCreateSubscription = async () => {
    if (!organization?.id) {
      setError("No organization selected");
      return null;
    }

    if (!planId) {
      setError("No subscription plan selected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Create subscription
      const response = await fetch("/api/paypal/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgId: organization.id,
          planId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const responseData = await response.json();
      setSubscriptionId(responseData.id);
      return responseData.id;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create subscription";
      setError(errorMessage);
      if (onError) onError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (data: any) => {
    if (!organization?.id || !data.subscriptionID) {
      setError("Missing organization or subscription information");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate the subscription approval
      const response = await fetch("/api/paypal/validate-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgId: organization.id,
          subscriptionId: data.subscriptionID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to validate subscription");
      }

      const responseData = await response.json();
      setSuccess(true);
      if (onSuccess) onSuccess(responseData);
      return responseData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to validate subscription";
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
        <CardTitle>Subscribe to Plan</CardTitle>
        <CardDescription>
          {isAccountConnected
            ? planDetails
              ? `${planDetails.name} - ${description}`
              : "Loading plan details..."
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
          <Alert className="bg-green-500/10 border-green-500">
            <AlertTitle className="text-green-500">
              Subscription Successful
            </AlertTitle>
            <AlertDescription className="text-green-500">
              Your subscription has been activated successfully!
            </AlertDescription>
          </Alert>
        )}

        {(accountLoading || planLoading) && (
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
              accepting subscriptions.
            </AlertDescription>
          </Alert>
        )}

        {isAccountConnected && planDetails && !success && (
          <div className="space-y-4">
            {planDetails.billing_cycles &&
              planDetails.billing_cycles.map((cycle, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span>
                      {cycle.tenure_type === "REGULAR"
                        ? "Regular Price"
                        : `Trial ${index + 1}`}
                      :
                    </span>
                    <span className="font-medium">
                      {cycle.pricing_scheme?.fixed_price.value}{" "}
                      {cycle.pricing_scheme?.fixed_price.currency_code}
                      {cycle.frequency &&
                        ` / ${cycle.frequency.interval_count || 1} ${cycle.frequency.interval_unit.toLowerCase()}`}
                    </span>
                  </div>
                  {cycle.total_cycles && cycle.total_cycles > 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Duration:</span>
                      <span>
                        {cycle.total_cycles}{" "}
                        {cycle.frequency?.interval_unit.toLowerCase()}
                        {cycle.total_cycles > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              ))}

            <div className="mt-6">
              <PayPalScriptProvider
                options={{
                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                  vault: true,
                  intent: "subscription",
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
                    createSubscription={handleCreateSubscription}
                    onApprove={handleApprove}
                    onError={(err: any) => {
                      console.error("PayPal Error:", err);
                      setError(
                        "An error occurred with PayPal. Please try again.",
                      );
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
