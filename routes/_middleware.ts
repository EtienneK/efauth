import { config } from "../utils/config.ts";
import { FreshContext } from "$fresh/server.ts";

export const handler = [
  function proxyHeadersMiddleware(
    req: Request,
    ctx: FreshContext,
  ) {
    if (config().server.proxy) {
      // const forwardedFor = req.headers.get("x-forwarded-for"); // TODO ?

      const forwardedProto = req.headers.get("x-forwarded-proto");
      ctx.url.protocol = `${forwardedProto}:` ?? ctx.url.protocol;

      const forwardedHost = req.headers.get("x-forwarded-host");
      const hostHeader = req.headers.get("host");
      ctx.url.host = forwardedHost ?? (hostHeader ?? ctx.url.host);
    } else {
      const hostHeader = req.headers.get("host");
      ctx.url.host = hostHeader ?? ctx.url.host;
    }

    return ctx.next();
  },
];
