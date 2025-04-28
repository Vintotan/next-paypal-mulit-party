"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { OrganizationSwitcher } from "@/components/clerk/OrganizationSwitcher";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function UserMenu() {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="p-3">
          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({
                  variant: "default",
                  size: "sm",
                }),
              )}
            >
              Dashboard
            </Link>

            <div className="flex items-center justify-between">
              <span className="text-sm">Theme</span>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between">
              {/* <span className="text-sm">Organization</span> */}
              <OrganizationSwitcher />
            </div>

            <div className="flex items-center justify-between">
              {/* <span className="text-sm">Account</span> */}
              <UserButton
                appearance={{
                  elements: {
                    rootBox: "flex",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
