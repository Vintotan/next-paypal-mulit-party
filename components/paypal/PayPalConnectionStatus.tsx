"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { CheckCircle2, AlertCircle, Clock, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "disconnected" | "loading" | null;

type AccountDetails = {
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

export function PayPalConnectionStatus() {
  const { organization } = useOrganization();
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(
    null,
  );

  const fetchConnectionStatus = useCallback(async () => {
    if (!organization?.id) {
      setStatus(null);
      return;
    }

    setStatus("loading");
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/paypal/connected-account?orgId=${organization.id}&_t=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setAccountDetails(data);
        setStatus(data.status === "active" ? "connected" : "disconnected");
      } else if (response.status === 404) {
        setStatus("disconnected");
        setAccountDetails(null);
      } else {
        throw new Error(
          `Failed to fetch connection status: ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error("Error fetching PayPal connection status:", err);
      setStatus("disconnected");
      setAccountDetails(null);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

  if (!organization) {
    return null;
  }

  const getBadgeDetails = () => {
    switch (status) {
      case "connected":
        return {
          label: "PayPal Connected",
          className: "bg-green-500/10 text-green-500 border-green-500",
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
        };
      case "disconnected":
        return {
          label: "PayPal Not Connected",
          className: "bg-red-500/10 text-red-500 border-red-500",
          icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
        };
      case "loading":
        return {
          label: "Checking Connection...",
          className: "bg-blue-500/10 text-blue-500 border-blue-500",
          icon: (
            <LoaderCircle className="h-3.5 w-3.5 text-blue-500 animate-spin" />
          ),
        };
      default:
        return {
          label: "Select Organization",
          className: "bg-gray-500/10 text-gray-500 border-gray-500",
          icon: <Clock className="h-3.5 w-3.5 text-gray-500" />,
        };
    }
  };

  const { label, className, icon } = getBadgeDetails();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
