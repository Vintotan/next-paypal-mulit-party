import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/app/api/trpc/root";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => ({}),
  });

export { handler as GET, handler as POST };
