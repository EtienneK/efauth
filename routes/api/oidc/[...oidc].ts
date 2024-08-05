import { FreshContext } from "$fresh/server.ts";

export const handler = async (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const { host, pathname, search, protocol } = new URL(req.url);
  const url = new URL(
    "." + pathname.replace("/api/oidc", ""),
    "http://localhost:3000",
  );
  url.search = search;

  let forwardedFor = req.headers.get("X-Forwarded-For");
  if (forwardedFor) {
    // TODO: Add proxy protection here
    forwardedFor += ", ";
  } else {
    forwardedFor = _ctx.remoteAddr.hostname + ", ";
  }
  forwardedFor += "127.0.0.1";

  const headers = new Headers(req.headers);
  headers.set("Host", url.host);
  headers.set("X-Forwarded-For", forwardedFor);
  headers.set("X-Forwarded-Host", host);
  headers.set("X-Forwarded-Proto", protocol.replace(":", ""));

  return await fetch(url, {
    method: req.method,
    headers,
    body: req.body,
    redirect: "manual",
  });
};
