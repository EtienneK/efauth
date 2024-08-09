import { FreshContext, Handlers } from "$fresh/server.ts";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter as router } from "../../../trpc/server/routes/app.ts";
import { createContext } from "../../../trpc/context.ts";

const trpcHandler = (req: Request, _ctx: FreshContext) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router,
    createContext,
  });
};

export const handler: Handlers = {
  GET: trpcHandler,
  POST: trpcHandler,
};
