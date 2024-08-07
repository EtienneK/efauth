import { FreshContext } from "$fresh/server.ts";
import { NodeRequest, NodeResponse, oidc } from "../../../oidc/oidc.ts";

const oidcCallback = oidc.callback();

export const handler = async (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const nodeRequest = new NodeRequest(req, await req.bytes());
  const nodeResponse = new NodeResponse();

  // deno-lint-ignore no-explicit-any
  await oidcCallback(nodeRequest as any, nodeResponse as any);

  return nodeResponse.toResponse();
};
