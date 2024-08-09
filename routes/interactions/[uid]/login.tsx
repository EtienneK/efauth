import { FreshContext } from "$fresh/server.ts";
import { assert } from "$std/assert/assert.ts";
import UsernamePassword from "../../../islands/UsernamePassword.tsx";
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
  return (
    <html className="bg-base-300">
      <div className="flex flex-row min-h-screen justify-center items-center p-5">
        <div className="card bg-base-100 w-96 shadow-xl">
          <div className="card-body items-center text-center">
            <img src="/logo.svg" className="w-16 h-16" />
            <UsernamePassword />
          </div>
        </div>
      </div>
    </html>
  );
}
