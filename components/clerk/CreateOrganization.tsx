"use client";

import { CreateOrganization as ClerkCreateOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

interface CreateOrganizationProps {
  afterCreateOrganizationUrl?: string;
}

export function CreateOrganization({
  afterCreateOrganizationUrl = "/dashboard",
}: CreateOrganizationProps) {
  const [showModal, setShowModal] = useState(false);

  if (showModal) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white p-4 rounded-lg max-w-md w-full">
          <ClerkCreateOrganization
            afterCreateOrganizationUrl={afterCreateOrganizationUrl}
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-none",
                formButtonPrimary: "bg-black hover:bg-gray-800",
              },
            }}
          />
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="mt-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a new organization</CardTitle>
        <CardDescription>
          Organizations help you collaborate with others and manage payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Create an organization to:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>Connect your PayPal merchant account</li>
          <li>Invite team members to manage sales</li>
          <li>Manage multiple business entities</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={() => setShowModal(true)} className="w-full">
          Create Organization
        </Button>
      </CardFooter>
    </Card>
  );
}
