import { FreshContext, Handlers } from "$fresh/server.ts";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { interactionsRouter as router } from "../../../../trpc/server/routes/interactions.ts";
import { createContext } from "../../../../trpc/context.ts";

const trpcHandler = (req: Request, ctx: FreshContext) => {
  const { uid } = ctx.params;
  return fetchRequestHandler({
    endpoint: `/interactions/${uid}/trpc`,
    req,
    router,
    createContext,
  });
};

export const handler: Handlers = {
  GET: trpcHandler,
  POST: trpcHandler,
};
