import { FreshContext } from "$fresh/server.ts";

export const handler = (
  _req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  return Promise.resolve(
    new Response("", {
      status: 302,
      headers: {
        location: "/admin",
      },
    }),
  );
};
