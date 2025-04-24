"use client";

import { useUser, useOrganization } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function ClerkTestContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { organization } = useOrganization();

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Clerk Test Page</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
            </div>
            <div>
              {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
                `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}`
              ) : (
                <span className="text-red-500">Missing</span>
              )}
            </div>

            <div className="font-medium">CLERK_SECRET_KEY:</div>
            <div>
              {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
                <Badge variant="default" className="bg-green-600">
                  Available
                </Badge>
              ) : (
                <Badge variant="destructive">Not Available</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Clerk Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Is Loaded</TableCell>
                <TableCell>{isLoaded ? "Yes" : "No"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Is Signed In</TableCell>
                <TableCell>{isSignedIn ? "Yes" : "No"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Email</TableCell>
                <TableCell>
                  {isSignedIn && user?.primaryEmailAddress
                    ? user.primaryEmailAddress.emailAddress
                    : "Not available"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Account ID</TableCell>
                <TableCell>
                  {isSignedIn && user ? user.id : "Not available"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Organization Name</TableCell>
                <TableCell>
                  {organization
                    ? organization.name
                    : "No organization selected"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Organization ID</TableCell>
                <TableCell>
                  {organization ? organization.id : "Not available"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Raw Clerk Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded overflow-auto text-sm">
            {JSON.stringify(
              {
                isLoaded,
                isSignedIn,
                userId: user?.id,
                userEmail: user?.primaryEmailAddress?.emailAddress,
                windowClerk:
                  typeof window !== "undefined"
                    ? // @ts-expect-error because Clerk is not defined in the window object
                      !!window.Clerk
                    : false,
                key: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
                  ? "Set (first 6 chars: " +
                    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(
                      0,
                      6,
                    ) +
                    ")"
                  : "Not set",
              },
              null,
              2,
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClerkTestPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-10">Loading Clerk test page...</div>
      }
    >
      <ClerkTestContent />
    </Suspense>
  );
}
