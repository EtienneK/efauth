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
  return (
    <html className="bg-base-300">
      <div className="flex flex-row min-h-screen justify-center items-center p-5">
        <div className="card bg-base-100 w-96 shadow-xl">
          <div className="card-body items-center text-center">
            <img src="/logo.svg" className="w-16 h-16" />

            <h2 className="card-title mt-2 mb-2">Welcome</h2>

            <label class="input input-bordered flex items-center gap-2 w-full max-w-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                class="h-4 w-4 opacity-70"
              >
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
              </svg>
              <input
                type="text"
                class="grow"
                placeholder="Username or email address"
              />
            </label>

            <label className="input input-bordered flex items-center gap-2 w-full max-w-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                  clipRule="evenodd"
                />
              </svg>
              <input type="password" className="grow" placeholder="Password" />
            </label>

            <button className="btn btn-primary w-full mt-2">Login</button>
          </div>
        </div>
      </div>
    </html>
  );
}
