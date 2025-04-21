"use client";

import { OrganizationSwitcher as ClerkOrganizationSwitcher } from "@clerk/nextjs";
import { useEffect } from "react";

export function OrganizationSwitcher() {
  useEffect(() => {
    console.log("[Clerk Debug] OrganizationSwitcher mounted");
  }, []);

  return (
    <ClerkOrganizationSwitcher
      appearance={{
        elements: {
          organizationSwitcherTrigger: "py-2 px-4",
          organizationPreviewTextContainer: "font-medium text-sm",
          organizationPreviewMainIdentifier: "font-semibold",
          organizationSwitcherPopoverRootBox:
            "border border-gray-200 shadow-lg rounded-lg",
          organizationSwitcherPopoverActionButton: "text-sm",
          organizationSwitcherPopoverActionButtonIcon: "w-4 h-4",
          organizationSwitcherPopoverCreateOrganizationButton: "text-sm",
        },
      }}
      hidePersonal={false}
      createOrganizationMode="modal"
      afterSelectOrganizationUrl="/dashboard"
      afterCreateOrganizationUrl="/dashboard"
      afterLeaveOrganizationUrl="/dashboard"
    />
  );
}
