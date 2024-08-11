import type { InteractionsRouter } from "../server/routes/interactions.ts";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";

export function newClient(url: string) {
  return createTRPCClient<InteractionsRouter>({
    links: [
      httpBatchLink({
        url,
        transformer: superjson,
      }),
    ],
  });
}

const clientCache: { [key: string]: ReturnType<typeof newClient> } = {};
export function client(url: string) {
  let ret = clientCache[url];
  if (!ret) {
    ret = newClient(url);
    clientCache[url] = ret;
  }
  return ret;
}

export type InteractionsRouterInput = inferRouterInputs<InteractionsRouter>;
export type InteractionsRouterOutput = inferRouterOutputs<InteractionsRouter>;
