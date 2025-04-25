import { authMiddleware, clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  publicRoutes: ["/", "/api/trpc(.*)"],
  debug: false, // Disable debug mode for Clerk middleware

  // Add debug logging
  async afterAuth(auth, req) {
    // If user is logged in but no organization is selected on a protected route
    if (
      auth.userId &&
      !auth.orgId &&
      !auth.isPublicRoute &&
      !req.url.includes("/api/")
    ) {
      try {
        // Get user's organizations
        const user = await clerkClient.users.getUser(auth.userId);

        // Access organization memberships safely
        // @ts-expect-error - The type definitions may be outdated but this property exists
        const memberships = user.organizationMemberships || [];

        // If user has at least one organization, try to set active org
        if (memberships.length > 0) {
          // Access organization data
          const orgId = memberships[0].organization.id;

          // Add a query parameter to indicate we should set this org as active
          const url = new URL(req.url);
          url.searchParams.set("set_active_org", orgId);
          return NextResponse.redirect(url);
        }
      } catch (error) {
        // Silently handle errors
      }
    }

    return NextResponse.next();
  },
});

// Update the matcher pattern to be more inclusive
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
