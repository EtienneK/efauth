import { z } from "zod";
import { createCallerFactory, publicProcedure, router } from "../trpc.ts";
import db from "../../../db/db.ts";
import { hashVerify } from "../../../utils/crypto.ts";
import { NodeRequest, NodeResponse, oidc } from "../../../oidc/oidc.ts";

export const interactionsRouter = router({
  login: publicProcedure
    .input(z.object({
      usernameOrEmail: z.string().min(1),
      password: z.string().min(1),
    }))
    .mutation(async ({ ctx, input: { usernameOrEmail, password } }) => {
      const user = await db.users.findByUsernameOrEmailCi(usernameOrEmail);

      if (!user) {
        return undefined;
      }

      if (!(await hashVerify(user.password, password))) {
        return undefined;
      }

      const result = {
        login: {
          accountId: user.id,
        },
      };

      const nodeRequest = new NodeRequest(ctx.req, new Uint8Array([]));
      const nodeResponse = new NodeResponse();
      const redirectTo = await oidc().provider.interactionResult(
        // deno-lint-ignore no-explicit-any
        nodeRequest as any,
        // deno-lint-ignore no-explicit-any
        nodeResponse as any,
        result,
      );

      return { redirectTo };
    }),
});

export type InteractionsRouter = typeof interactionsRouter;
export const callerFactory = createCallerFactory(interactionsRouter);
