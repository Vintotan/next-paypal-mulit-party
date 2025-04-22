"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PayPalCheckout } from "@/components/paypal/PayPalCheckout";
import { PayPalSubscription } from "@/components/paypal/PayPalSubscription";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Type for subscription plan
type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: string;
  interval: string;
};

export default function TestPayPalPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "subscription" ? "subscription" : "oneTime",
  );

  // One-time payment state
  const [amount, setAmount] = useState("10.00");
  const [platformFee, setPlatformFee] = useState("2.00");
  const [currency, setCurrency] = useState("USD");
  const [showOneTimeCheckout, setShowOneTimeCheckout] = useState(false);

  // Subscription state
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [showSubscriptionCheckout, setShowSubscriptionCheckout] =
    useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // New plan form state
  const [showCreatePlanForm, setShowCreatePlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: "",
    interval: "MONTH",
    trialPrice: "",
    trialDuration: "",
  });
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [createError, setCreateError] = useState("");

  // Update active tab when URL parameters change
  useEffect(() => {
    if (tabParam === "subscription") {
      setActiveTab("subscription");
    } else if (tabParam === "oneTime") {
      setActiveTab("oneTime");
    }
  }, [tabParam]);

  // Fetch subscription plans when component mounts
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  // Fetch subscription plans from PayPal
  const fetchSubscriptionPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await fetch("/api/paypal/get-plans");
      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }
      const data = await response.json();
      if (data.success && data.plans) {
        setSubscriptionPlans(data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Create a new subscription plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPlan(true);
    setCreateError("");

    try {
      const response = await fetch("/api/paypal/create-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlan),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create plan");
      }

      // Add the new plan to the list
      if (data.success && data.plan) {
        setSubscriptionPlans((prev) => [...prev, data.plan]);
        // Reset form
        setNewPlan({
          name: "",
          description: "",
          price: "",
          interval: "MONTH",
          trialPrice: "",
          trialDuration: "",
        });
        setShowCreatePlanForm(false);
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      setCreateError(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleStartOneTime = () => {
    setShowOneTimeCheckout(true);
  };

  const handleResetOneTime = () => {
    setShowOneTimeCheckout(false);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleStartSubscription = () => {
    if (selectedPlanId) {
      setShowSubscriptionCheckout(true);
    }
  };

  const handleResetSubscription = () => {
    setShowSubscriptionCheckout(false);
  };

  const handleSuccess = (details: any) => {
    console.log("Payment successful!", details);
    // You would typically redirect or update UI here
  };

  const handleError = (error: any) => {
    console.error("Payment error:", error);
  };

  // Handle input change for new plan form
  const handlePlanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPlan((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select change for interval
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewPlan((prev) => ({ ...prev, interval: e.target.value }));
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">PayPal Test Page</h1>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="oneTime">One-Time Payment</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        {/* One-Time Payment Tab */}
        <TabsContent value="oneTime">
          {!showOneTimeCheckout ? (
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle>One-Time Payment</CardTitle>
                <CardDescription>
                  Configure your payment details
                </CardDescription>
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

                <Button onClick={handleStartOneTime} className="w-full mt-4">
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
                <Button variant="outline" onClick={handleResetOneTime}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          {!showSubscriptionCheckout ? (
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Subscription</CardTitle>
                    <CardDescription>
                      Select a subscription plan
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreatePlanForm(!showCreatePlanForm)}
                  >
                    {showCreatePlanForm ? "Cancel" : "Create Plan"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create Plan Form */}
                {showCreatePlanForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Create New Plan</CardTitle>
                      <CardDescription>
                        Define your subscription plan details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreatePlan} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Plan Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={newPlan.name}
                            onChange={handlePlanInputChange}
                            placeholder="Premium Subscription"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            name="description"
                            value={newPlan.description}
                            onChange={handlePlanInputChange}
                            placeholder="Premium features with monthly billing"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            name="price"
                            value={newPlan.price}
                            onChange={handlePlanInputChange}
                            placeholder="19.99"
                            required
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="interval">Billing Interval</Label>
                          <select
                            id="interval"
                            name="interval"
                            value={newPlan.interval}
                            onChange={handleIntervalChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="DAY">Daily</option>
                            <option value="WEEK">Weekly</option>
                            <option value="MONTH">Monthly</option>
                            <option value="YEAR">Yearly</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="trialPrice">
                            Trial Price (Optional)
                          </Label>
                          <Input
                            id="trialPrice"
                            name="trialPrice"
                            value={newPlan.trialPrice}
                            onChange={handlePlanInputChange}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="trialDuration">
                            Trial Duration (Optional)
                          </Label>
                          <Input
                            id="trialDuration"
                            name="trialDuration"
                            value={newPlan.trialDuration}
                            onChange={handlePlanInputChange}
                            placeholder="1"
                            type="number"
                            min="0"
                          />
                        </div>

                        {createError && (
                          <div className="text-red-500 text-sm">
                            {createError}
                          </div>
                        )}

                        <Button
                          type="submit"
                          disabled={isCreatingPlan}
                          className="w-full"
                        >
                          {isCreatingPlan && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Plan
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Plan Selection */}
                {!showCreatePlanForm && (
                  <>
                    {isLoadingPlans ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : subscriptionPlans.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No subscription plans found.</p>
                        <p className="text-sm mt-2">
                          Click &quot;Create Plan&quot; to create your first
                          subscription plan.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Available Plans</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchSubscriptionPlans}
                            disabled={isLoadingPlans}
                          >
                            Refresh
                          </Button>
                        </div>
                        {subscriptionPlans.map((plan) => (
                          <div
                            key={plan.id}
                            className={`border rounded-md p-4 cursor-pointer transition-colors ${
                              selectedPlanId === plan.id
                                ? "border-primary bg-primary/5"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => handleSelectPlan(plan.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{plan.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {plan.description}
                                </p>
                              </div>
                              <div className="font-bold">
                                ${plan.price}/{plan.interval}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={handleStartSubscription}
                      className="w-full mt-4"
                      disabled={!selectedPlanId}
                    >
                      Subscribe Now
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>
              <PayPalSubscription
                planId={selectedPlanId}
                description="Test Subscription"
                onSuccess={handleSuccess}
                onError={handleError}
              />
              <div className="text-center mt-4">
                <Button variant="outline" onClick={handleResetSubscription}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
