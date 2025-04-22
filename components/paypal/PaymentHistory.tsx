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

  // Fetch transactions when the component mounts
  useEffect(() => {
    const fetchTransactions = async () => {
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
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/paypal/transactions?orgId=${organization.id}&_t=${timestamp}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data = await response.json();
        setTransactions(data);
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

    fetchTransactions();
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
        variant = "default"; // green
        break;
      case "created":
      case "pending":
        variant = "secondary"; // amber
        break;
      case "denied":
      case "voided":
      case "failed":
        variant = "destructive"; // red
        break;
      default:
        variant = "outline"; // gray
    }

    return <Badge variant={variant}>{status}</Badge>;
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
