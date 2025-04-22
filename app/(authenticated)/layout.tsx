import { ReactNode } from "react";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = auth();

  // If the user is not authenticated, redirect to sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  // If authenticated, render the children
  return <>{children}</>;
}
