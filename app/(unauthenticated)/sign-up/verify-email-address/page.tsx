"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useSignUp } from "@clerk/nextjs";

export default function VerifyEmailAddressPage() {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  // Check if we need to prepare the verification when the page loads
  useEffect(() => {
    const prepareVerification = async () => {
      if (!isLoaded || !signUp) return;

      try {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      } catch (err) {
        console.error("Failed to prepare email verification:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to send verification code. Please try again.",
        );
      }
    };

    prepareVerification();
  }, [isLoaded, signUp]);

  const handleVerify = async () => {
    if (!isLoaded || !signUp) return;

    if (code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Attempt to verify the email with the code
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        // Set the newly created session as active
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        router.push("/dashboard");
      } else {
        // Handle incomplete verification
        setError(
          "Additional verification steps required. Please continue with the flow.",
        );
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify email. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !signUp) return;

    try {
      // Prepare a new verification by sending a new code
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setError(null);
    } catch (err) {
      console.error("Resend error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend code. Please try again.",
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md p-6 bg-card rounded-lg border shadow-md dark:border-gray-700">
        <h1 className="text-2xl font-bold text-center mb-2">
          Verify your email
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          We&apos;ve sent a 6-digit code to your email address. Please enter it
          below.
        </p>

        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              render={({ slots }) => (
                <InputOTPGroup className="gap-2">
                  {slots.map((slot, index) => (
                    <InputOTPSlot
                      key={index}
                      {...slot}
                      className="w-10 h-12 text-lg dark:border-gray-700 dark:bg-card"
                    />
                  ))}
                </InputOTPGroup>
              )}
            />

            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </Button>

          <div className="flex flex-col items-center gap-2 mt-4 text-sm">
            <p className="text-muted-foreground">
              Didn&apos;t receive a code?{" "}
              <button
                onClick={handleResend}
                className="text-primary underline hover:text-primary/80"
              >
                Resend code
              </button>
            </p>
            <Link
              href="/sign-up"
              className="text-muted-foreground hover:text-foreground"
            >
              Go back to sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
