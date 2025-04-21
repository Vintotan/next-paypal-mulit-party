import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
          PayPal Multi-Party Platform
        </h1>
        <p className="text-xl mb-10">
          Create a multi-tenant platform with PayPal Multi-party payments
          integration, allowing your users to connect their PayPal accounts and
          receive payments.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a
              href="https://developer.paypal.com/docs/multiparty/"
              target="_blank"
              rel="noopener noreferrer"
            >
              PayPal Documentation
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
