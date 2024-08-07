import { FreshContext } from "$fresh/server.ts";
import { assert } from "$std/assert/assert.ts";
import { NodeRequest, NodeResponse, oidc } from "../../../oidc/oidc.ts";

export const handler = async (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const nodeRequest = new NodeRequest(req, await req.bytes());
  const nodeResponse = new NodeResponse();

  const { prompt } = await oidc.interactionDetails(
    // deno-lint-ignore no-explicit-any
    nodeRequest as any,
    // deno-lint-ignore no-explicit-any
    nodeResponse as any,
  );

  assert(prompt.name === "login");

  return await ctx.render();
};

export default function Login() {
  return <div>Login!</div>;
}
