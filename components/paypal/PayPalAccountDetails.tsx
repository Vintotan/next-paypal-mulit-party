"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PayPalConnectionStatus } from "./PayPalConnectionStatus";

type PayPalAccount = {
  id: string;
  orgId: string;
  merchantId: string;
  email: string | null;
  businessName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  isLive: boolean;
};

export function PayPalAccountDetails() {
  const { organization } = useOrganization();
  const [account, setAccount] = useState<PayPalAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch account details when the component mounts
  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!organization?.id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/paypal/account-details?orgId=${organization.id}`,
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch account details");
        }

        const data = await response.json();
        // Only set the account if it's active
        if (data.account && data.account.status === "active") {
          setAccount(data.account);
        } else {
          setAccount(null);
        }
      } catch (err) {
        console.error("Error fetching PayPal account details:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching account details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [organization?.id]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PayPal Account Details</CardTitle>
          <CardDescription>Loading account information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PayPal Account Details</CardTitle>
          <CardDescription className="text-red-500">
            Error: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PayPal Account Details</CardTitle>
          <CardDescription>
            No PayPal account connected. Please connect your PayPal account
            first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>PayPal Account Details</CardTitle>
          <PayPalConnectionStatus />
        </div>
        <CardDescription>
          Information about your connected PayPal merchant account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Account ID
              </h3>
              <p className="font-medium text-sm">{account.merchantId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Status
              </h3>
              <Badge
                variant={account.status === "active" ? "default" : "secondary"}
              >
                {account.status}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Business Name
              </h3>
              <p>{account.businessName || "Not provided"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Email
              </h3>
              <p>{account.email || "Not provided"}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Environment
              </h3>
              <Badge variant={account.isLive ? "destructive" : "outline"}>
                {account.isLive ? "Production" : "Sandbox"}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Connected On
              </h3>
              <p>{formatDate(account.createdAt)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Integration Status
            </h3>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm">
                This account is configured to receive payments with platform
                fees. Your organization will receive the transaction amount
                minus any platform fees.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
