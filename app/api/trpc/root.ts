import { paypalRouter } from "./routers/paypal";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  paypal: paypalRouter,
});

export type AppRouter = typeof appRouter;
