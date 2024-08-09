import type { AppRouter } from "./server/routes/app.ts";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";

export function newClient(url: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url,
        transformer: superjson,
      }),
    ],
  });
}

const clientCache: { [key: string]: ReturnType<typeof newClient> } = {};
export function client(url: string = "/api/trpc") {
  let ret = clientCache[url];
  if (!ret) {
    ret = newClient(url);
    clientCache[url] = ret;
  }
  return ret;
}

export type AppRouterInput = inferRouterInputs<AppRouter>;
export type AppRouterOutput = inferRouterOutputs<AppRouter>;
