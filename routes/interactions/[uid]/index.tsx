import { FreshContext, Handlers } from "$fresh/server.ts";
import { NodeRequest, NodeResponse, oidc } from "../../../oidc/oidc.ts";

export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    const nodeRequest = new NodeRequest(req, await req.bytes());
    const nodeResponse = new NodeResponse();

    const { uid, prompt } = await oidc(ctx).provider.interactionDetails(
      // deno-lint-ignore no-explicit-any
      nodeRequest as any,
      // deno-lint-ignore no-explicit-any
      nodeResponse as any,
    );

    switch (prompt.name) {
      case "login":
        return new Response(undefined, {
          headers: { location: `/interactions/${uid}/login` },
          status: 302,
        });
    }
    throw Error(`unknown prompt: ${prompt.name}`);
  },
};
