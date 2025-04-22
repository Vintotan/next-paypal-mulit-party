// server/api/routers/paypal.ts
import { createTRPCRouter, protectedProcedure } from "../trpc";
import paypalClient from "@/lib/paypal/client";
import {
  createOrderWithPlatformFee,
  captureOrder,
  setupMerchantWebhook,
} from "@/lib/paypal/multiparty";
import { db } from "@/db";
import { paypalAccounts, organizations } from "@/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const paypalRouter = createTRPCRouter({
  // Get connected PayPal account for the organization
  getConnectedAccount: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }: { input: { orgId: string } }) => {
      const accounts = await db.select().from(paypalAccounts);
      return accounts.find((account) => account.orgId === input.orgId);
    }),

  // Connect a PayPal account to an organization
  connectAccount: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        merchantId: z.string(),
        email: z.string().email().optional(),
        businessName: z.string().optional(),
      }),
    )
    .mutation(
      async ({
        input,
      }: {
        input: {
          orgId: string;
          merchantId: string;
          email?: string;
          businessName?: string;
        };
      }) => {
        // In a real application, this would involve OAuth flow with PayPal
        // Here we're simulating account connection with direct merchant data

        // Check if organization exists in our database
        const orgs = await db.select().from(organizations);
        const existingOrg = orgs.find((org) => org.clerkId === input.orgId);

        if (!existingOrg) {
          await db.insert(organizations).values({
            id: crypto.randomUUID(),
            clerkId: input.orgId,
            name:
              input.businessName ||
              "Organization " + input.orgId.substring(0, 8),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Check if PayPal account already exists
        const accounts = await db.select().from(paypalAccounts);
        const existingAccount = accounts.find(
          (account) => account.orgId === input.orgId,
        );

        if (existingAccount) {
          const updatedAccount = {
            ...existingAccount,
            merchantId: input.merchantId,
            email: input.email || existingAccount.email,
            businessName: input.businessName || existingAccount.businessName,
            status: "active",
            updatedAt: new Date(),
          };

          // Update in database
          await db
            .update(paypalAccounts)
            .set({
              merchantId: input.merchantId,
              email: input.email,
              businessName: input.businessName,
              status: "active",
              updatedAt: new Date(),
            })
            .where(eq(paypalAccounts.id, existingAccount.id));

          return updatedAccount;
        }

        // Create new account
        const newAccount = {
          id: crypto.randomUUID(),
          orgId: input.orgId,
          merchantId: input.merchantId,
          email: input.email,
          businessName: input.businessName,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          isLive: false,
          webhookId: null,
          credentials: null,
        };

        await db.insert(paypalAccounts).values(newAccount);

        return newAccount;
      },
    ),

  // Disconnect a PayPal account from an organization
  disconnectAccount: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ input }: { input: { orgId: string } }) => {
      // Find the account
      const accounts = await db.select().from(paypalAccounts);
      const existingAccount = accounts.find(
        (account) => account.orgId === input.orgId,
      );

      if (!existingAccount) {
        throw new Error("No PayPal account found for this organization");
      }

      // Update the account status to inactive
      await db
        .update(paypalAccounts)
        .set({
          status: "inactive",
          updatedAt: new Date(),
        })
        .where(eq(paypalAccounts.id, existingAccount.id));

      // In a real application, you might also need to disconnect webhooks
      // or perform other cleanup with the PayPal API

      return { success: true };
    }),

  // Create order with platform fee
  createOrderWithFee: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        amount: z.string(),
        platformFee: z.string(),
        currency: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(
      async ({
        input,
      }: {
        input: {
          orgId: string;
          amount: string;
          platformFee: string;
          currency?: string;
          description?: string;
        };
      }) => {
        return createOrderWithPlatformFee({
          amount: input.amount,
          platformFee: input.platformFee,
          currency: input.currency,
          description: input.description,
          orgId: input.orgId,
        });
      },
    ),

  // Capture an order
  captureOrder: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        orderId: z.string(),
      }),
    )
    .mutation(
      async ({
        input,
      }: {
        input: {
          orgId: string;
          orderId: string;
        };
      }) => {
        return captureOrder({
          orderId: input.orderId,
          orgId: input.orgId,
        });
      },
    ),

  // Set up webhook for merchant
  setupWebhook: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        notificationUrl: z.string().url(),
      }),
    )
    .mutation(
      async ({
        input,
      }: {
        input: {
          orgId: string;
          notificationUrl: string;
        };
      }) => {
        const webhook = await setupMerchantWebhook({
          orgId: input.orgId,
          notificationUrl: input.notificationUrl,
        });

        // In a real implementation, you'd update the account with the webhook ID
        // For now, just return the webhook
        return webhook;
      },
    ),

  // Legacy method for creating basic orders (without platform fee)
  createOrder: protectedProcedure.mutation(async () => {
    const request = new paypalClient.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "100.00",
          },
        },
      ],
    });

    const response = await paypalClient.execute(request);
    return response.result;
  }),
});
