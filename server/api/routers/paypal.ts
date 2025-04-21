// server/api/routers/paypal.ts
import { createTRPCRouter, protectedProcedure } from "../trpc";
import paypalClient from "@/lib/paypal/client";
import {
  createOrderWithPlatformFee,
  captureOrder,
  setupMerchantWebhook,
} from "@/lib/paypal/multiparty";
import { db } from "@/db";
import { paypalAccounts } from "@/db/schema";
import { z } from "zod";

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

        // Check if account already exists
        const accounts = await db.select().from(paypalAccounts);
        const existingAccount = accounts.find(
          (account) => account.orgId === input.orgId,
        );

        if (existingAccount) {
          // In a real implementation, you'd use proper updates here
          // For now, return simulated updated account
          return {
            ...existingAccount,
            merchantId: input.merchantId,
            email: input.email,
            businessName: input.businessName,
            status: "active",
          };
        }

        // In a real implementation, you'd insert the account here
        // For now, return simulated new account
        return {
          id: crypto.randomUUID(),
          orgId: input.orgId,
          merchantId: input.merchantId,
          email: input.email,
          businessName: input.businessName,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          isLive: false,
        };
      },
    ),

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
