import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { appRouter } from "@/app/api/trpc/root";
import { type inferRouterOutputs, type inferRouterInputs } from "@trpc/server";

export const trpc = createTRPCClient<typeof appRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
    }),
  ],
});

// Types for inputs and outputs of the API
export type RouterOutputs = inferRouterOutputs<typeof appRouter>;
export type RouterInputs = inferRouterInputs<typeof appRouter>;
