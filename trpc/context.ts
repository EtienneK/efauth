import * as trpcNext from "@trpc/server/adapters/fetch";

export function createContext(opts: trpcNext.FetchCreateContextFnOptions) {
  return {
    req: opts.req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
