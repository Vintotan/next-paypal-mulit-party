import { paypalRouter } from "./routers/paypal";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  paypal: paypalRouter,
});

// Export type router type
export type AppRouter = typeof appRouter;
