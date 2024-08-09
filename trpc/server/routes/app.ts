import { createCallerFactory, router } from "../trpc.ts";
import { interactionsRouter } from "./interactions.ts";

export const appRouter = router({
  interactions: interactionsRouter,
});
export type AppRouter = typeof appRouter;
export const callerFactory = createCallerFactory(appRouter);
