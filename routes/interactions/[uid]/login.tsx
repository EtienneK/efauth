import { FreshContext, PageProps } from "$fresh/server.ts";
import { assert } from "$std/assert/assert.ts";
import UsernamePassword from "../../../islands/interactions/UsernamePassword.tsx";
import { NodeRequest, NodeResponse, oidc } from "../../../oidc/oidc.ts";

interface Props {
  uid: string;
}

export const handler = async (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const nodeRequest = new NodeRequest(req, await req.bytes());
  const nodeResponse = new NodeResponse();

  const { prompt } = await oidc(ctx).provider.interactionDetails(
    // deno-lint-ignore no-explicit-any
    nodeRequest as any,
    // deno-lint-ignore no-explicit-any
    nodeResponse as any,
  );

  assert(prompt.name === "login");

  return await ctx.render({ uid: ctx.params.uid });
};

export default function Login(props: PageProps<Props>) {
  return (
    <html className="bg-base-100">
      <div className="flex flex-row min-h-screen justify-center items-center p-5">
        <div className="card bg-base-200 w-96 shadow-xl">
          <div className="card-body items-center text-center">
            <img src="/logo.svg" className="w-16 h-16" />
            <UsernamePassword uid={props.data.uid} />
          </div>
        </div>
      </div>
    </html>
  );
}
