"use client";

import { useOrganizationList } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function OrganizationSelector() {
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  });
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Helper function to select an organization
  const selectOrganization = async (organization) => {
    try {
      if (organization) {
        await setActive({ organization: organization.id });
        setSelectedOrg(organization);
      }
    } catch (error) {
      console.error("Error setting active organization:", error);
    }
  };

  // Effect to automatically select the first organization if none is selected
  useEffect(() => {
    if (isLoaded && userMemberships?.data?.length > 0 && !selectedOrg) {
      const firstOrg = userMemberships.data[0].organization;
      selectOrganization(firstOrg);
    }
  }, [isLoaded, userMemberships, selectedOrg]);

  if (!isLoaded) {
    return <div>Loading organizations...</div>;
  }

  if (!userMemberships?.data?.length) {
    return (
      <Card className="w-full max-w-md mx-auto my-6">
        <CardHeader>
          <CardTitle>No Organizations</CardTitle>
          <CardDescription>
            You need to create or join an organization before connecting a
            PayPal account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <a
              href="https://clerk.com/docs/organizations/overview"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>Learn More</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto my-6">
      <CardHeader>
        <CardTitle>Select Organization</CardTitle>
        <CardDescription>
          Choose an organization to connect with PayPal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {userMemberships.data.map((membership) => (
            <Button
              key={membership.organization.id}
              onClick={() => selectOrganization(membership.organization)}
              variant={
                selectedOrg?.id === membership.organization.id
                  ? "default"
                  : "outline"
              }
              className="w-full justify-start"
            >
              {membership.organization.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
