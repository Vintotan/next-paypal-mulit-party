"use client";

import { useState } from "react";
import { PayPalCheckout } from "@/components/paypal/PayPalCheckout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TestPayPalPage() {
  const [amount, setAmount] = useState("10.00");
  const [platformFee, setPlatformFee] = useState("2.00");
  const [currency, setCurrency] = useState("USD");
  const [showCheckout, setShowCheckout] = useState(false);

  const handleStart = () => {
    setShowCheckout(true);
  };

  const handleReset = () => {
    setShowCheckout(false);
  };

  const handleSuccess = (details: any) => {
    console.log("Payment successful!", details);
    // You would typically redirect or update UI here
  };

  const handleError = (error: any) => {
    console.error("Payment error:", error);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">PayPal Test Page</h1>

      {!showCheckout ? (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Configure Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformFee">Platform Fee</Label>
              <Input
                id="platformFee"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                placeholder="2.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
              />
            </div>

            <Button onClick={handleStart} className="w-full mt-4">
              Proceed to Checkout
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <PayPalCheckout
            amount={amount}
            platformFee={platformFee}
            currency={currency}
            description="Test Payment"
            onSuccess={handleSuccess}
            onError={handleError}
          />
          <div className="text-center mt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
