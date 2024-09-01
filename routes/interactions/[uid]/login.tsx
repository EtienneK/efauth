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
    <div className="min-h-screen bg-base-200 flex items-center p-2">
      <div className="card bg-base-100 text-neutral mx-auto w-96 shadow-xl">
        <div class="card-body items-center text-center">
          <img
            className="w-16 h-16 mx-auto"
            src="/logo.svg"
            width={64}
            height={64}
          />
          <h2 className="card-title mb-2">
            Welcome!
          </h2>
          <UsernamePassword uid={props.data.uid} />
        </div>
      </div>
    </div>
  );
}
