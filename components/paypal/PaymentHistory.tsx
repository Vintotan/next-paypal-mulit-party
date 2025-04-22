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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Transaction = {
  id: string;
  orderId: string;
  amount: string;
  currency: string;
  status: string;
  platformFee: string;
  createdAt: string;
  buyerEmail?: string;
  paymentType?: "ONE_TIME" | "SUBSCRIPTION";
  description?: string;
  planId?: string;
  planName?: string;
  planPrice?: string;
  planInterval?: string;
};

export function PaymentHistory() {
  const { organization } = useOrganization();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccountActive, setIsAccountActive] = useState<boolean | null>(null);

  // Check if the account is active
  useEffect(() => {
    const checkAccountStatus = async () => {
      if (!organization?.id) {
        setIsAccountActive(null);
        return;
      }

      try {
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/paypal/connected-account?orgId=${organization.id}&_t=${timestamp}`,
        );

        if (response.ok) {
          const account = await response.json();
          setIsAccountActive(account.status === "active");
        } else {
          setIsAccountActive(false);
        }
      } catch (err) {
        console.error("Error checking account status:", err);
        setIsAccountActive(false);
      }
    };

    checkAccountStatus();
  }, [organization?.id]);

  // Fetch plan details for subscription transactions
  const fetchPlanDetails = async (planId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/paypal/plan-details?planId=${planId}`);
      if (response.ok) {
        const planData = await response.json();
        return planData.name || "Unknown Plan";
      }
    } catch (err) {
      console.error(`Error fetching plan details for ${planId}:`, err);
    }
    return "Unknown Plan";
  };

  // Fetch transactions when the component mounts
  useEffect(() => {
    const fetchAllTransactions = async () => {
      if (!organization?.id) return;
      if (isAccountActive === false) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      if (isAccountActive === null) return; // Wait for account status check

      setLoading(true);
      setError(null);

      try {
        // Fetch one-time payments
        const timestamp = new Date().getTime();
        const oneTimeResponse = await fetch(
          `/api/paypal/transactions?orgId=${organization.id}&_t=${timestamp}`,
        );

        let oneTimePayments: Transaction[] = [];
        if (oneTimeResponse.ok) {
          const data = await oneTimeResponse.json();
          // Add paymentType to each transaction
          oneTimePayments = data.map((tx: Transaction) => ({
            ...tx,
            paymentType: "ONE_TIME" as const,
          }));
        }

        // Fetch subscription payments
        const subscriptionResponse = await fetch(
          `/api/paypal/subscription-transactions?orgId=${organization.id}&_t=${timestamp}`,
        );

        let subscriptionPayments: Transaction[] = [];
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();

          // Process subscription data and fetch plan details for each subscription
          subscriptionPayments = await Promise.all(
            subscriptionData.map(async (sub: any) => {
              // Pass through all subscription data, including planPrice and planInterval
              let planName = sub.description || "Default Plan";

              // If the subscription doesn't have price/interval but has planId, attempt to fetch it
              if (sub.planId && (!sub.planPrice || !sub.planInterval)) {
                try {
                  const response = await fetch(
                    `/api/paypal/plan-details?planId=${sub.planId}`,
                  );
                  if (response.ok) {
                    const planData = await response.json();
                    planName = planData.name || planName;

                    // Extract price and interval if not already available
                    if (
                      !sub.planPrice &&
                      planData.billing_cycles &&
                      planData.billing_cycles.length > 0
                    ) {
                      const billingCycle =
                        planData.billing_cycles.find(
                          (cycle: any) => cycle.tenure_type === "REGULAR",
                        ) || planData.billing_cycles[0];

                      if (billingCycle?.pricing_scheme?.fixed_price?.value) {
                        sub.planPrice =
                          billingCycle.pricing_scheme.fixed_price.value;
                      }

                      if (billingCycle?.frequency?.interval_unit) {
                        sub.planInterval =
                          billingCycle.frequency.interval_unit.toLowerCase();
                      }
                    }
                  }
                } catch (err) {
                  console.error(
                    `Error fetching plan details for ${sub.planId}:`,
                    err,
                  );
                }
              }

              return {
                ...sub,
                planName,
              };
            }),
          );
        }

        // Combine and sort all transactions by date (newest first)
        const allTransactions = [
          ...oneTimePayments,
          ...subscriptionPayments,
        ].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setTransactions(allTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching transactions",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, [organization?.id, isAccountActive]);

  // Format amount with currency
  const formatAmount = (amount: string, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(parseFloat(amount));
  };

  // Format date without date-fns
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Render status badge with color
  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" | null =
      null;

    switch (status.toLowerCase()) {
      case "completed":
      case "active":
        variant = "default"; // green
        break;
      case "created":
      case "pending":
      case "approved":
        variant = "secondary"; // amber
        break;
      case "denied":
      case "voided":
      case "failed":
      case "cancelled":
      case "suspended":
        variant = "destructive"; // red
        break;
      default:
        variant = "outline"; // gray
    }

    return <Badge variant={variant}>{status}</Badge>;
  };

  // Render payment type badge
  const renderPaymentTypeBadge = (paymentType?: string) => {
    if (paymentType === "SUBSCRIPTION") {
      return <Badge variant="secondary">Subscription</Badge>;
    }
    return <Badge variant="outline">One-time</Badge>;
  };

  if (isAccountActive === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            No active PayPal account connected. Please connect your PayPal
            account to view transaction history.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Loading transaction history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription className="text-red-500">
            Error: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Check if we have any transaction data
  const hasTransactions = transactions && transactions.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>
          Recent PayPal transactions for your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasTransactions ? (
          <p className="text-muted-foreground text-center py-8">
            No transactions found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Buyer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                    <TableCell>
                      {renderPaymentTypeBadge(tx.paymentType)}
                    </TableCell>
                    <TableCell>{tx.description || "-"}</TableCell>
                    <TableCell>
                      {tx.paymentType === "SUBSCRIPTION" ? (
                        tx.planPrice && tx.planInterval ? (
                          <>
                            {tx.planName || "Subscription"}
                            <span className="ml-2 text-sm text-muted-foreground">
                              ${tx.planPrice}/{tx.planInterval}
                            </span>
                          </>
                        ) : (
                          tx.planName || "-"
                        )
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {tx.orderId}
                    </TableCell>
                    <TableCell>
                      {formatAmount(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell>
                      {formatAmount(tx.platformFee || "0", tx.currency)}
                    </TableCell>
                    <TableCell>{renderStatusBadge(tx.status)}</TableCell>
                    <TableCell>{tx.buyerEmail || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
