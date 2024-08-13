import { FreshContext } from "$fresh/server.ts";
import { NodeRequest, NodeResponse, oidc } from "../../oidc/oidc.ts";

export const handler = async (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const nodeRequest = new NodeRequest(req, await req.bytes());
  const nodeResponse = new NodeResponse();

  // deno-lint-ignore no-explicit-any
  await oidc(ctx).callback(nodeRequest as any, nodeResponse as any);

  return nodeResponse.toResponse();
};
