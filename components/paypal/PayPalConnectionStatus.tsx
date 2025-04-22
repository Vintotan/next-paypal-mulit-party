"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { CheckCircle2, AlertCircle, Clock, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "disconnected" | "loading" | null;

export function PayPalConnectionStatus() {
  const { organization } = useOrganization();
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [accountDetails, setAccountDetails] = useState<any>(null);

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
      );
      
      if (response.ok) {
        const data = await response.json();
        setAccountDetails(data);
        setStatus("connected");
      } else if (response.status === 404) {
        setStatus("disconnected");
      } else {
        throw new Error("Failed to fetch connection status");
      }
    } catch (err) {
      console.error("Error fetching PayPal connection status:", err);
      setStatus("disconnected");
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
          className: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
        };
      case "disconnected":
        return {
          label: "PayPal Not Connected",
          className: "bg-red-100 text-red-800 border-red-200",
          icon: <AlertCircle className="h-3.5 w-3.5 text-red-600" />,
        };
      case "loading":
        return {
          label: "Checking Connection...",
          className: "bg-blue-100 text-blue-800 border-blue-200",
          icon: (
            <LoaderCircle className="h-3.5 w-3.5 text-blue-600 animate-spin" />
          ),
        };
      default:
        return {
          label: "Select Organization",
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Clock className="h-3.5 w-3.5 text-gray-600" />,
        };
    }
  };

  const { label, className, icon } = getBadgeDetails();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
