import { createCallerFactory, router } from "../trpc.ts";

export const appRouter = router({});
export type AppRouter = typeof appRouter;
export const callerFactory = createCallerFactory(appRouter);
