// @ts-types="npm:@types/oidc-provider"
import Provider, { Configuration } from "oidc-provider";
import { Readable } from "node:stream";
import { createConfiguration } from "./configuration.ts";
import { IncomingMessage, ServerResponse } from "node:http";
import { config } from "../utils/config.ts";
import { FreshContext } from "$fresh/server.ts";

export type Oidc = {
  provider: Provider;
  configuration: Configuration;
  callback: (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<void>;
};

const oidcRouterPath = "/oidc";
let cached: Oidc;

export function oidc(ctx?: FreshContext): Oidc {
  if (!cached && !ctx) {
    throw new Error("ctx is required to create a new cached instance");
  } else if (cached) {
    return cached;
  }

  const baseUrl = new URL(
    config().server.baseUrl ?? new URL("/", ctx!.url),
  );

  const configuration = createConfiguration({ baseUrl });

  const issuer = config().oidc.issuer
    ? config().oidc.issuer!
    : new URL(oidcRouterPath, baseUrl).href;

  const provider = new Provider(issuer, configuration);
  provider.proxy = config().server.proxy;

  provider.on("server_error", (_ctx, err) => {
    console.error(err);
  });

  cached = { provider, configuration, callback: provider.callback() };
  return cached;
}

// -------------------------------------------------------------------------
// Convert to/from Node Request and Responses

export class NodeRequest extends Readable {
  public headers: Record<string, string> = {};
  public method: string | null;
  public originalUrl: string | null;
  public url: string | null;
  public socket: { encrypted: boolean };
  public length: number;

  constructor(req: Request, reqBodyBytes: Uint8Array) {
    super();

    for (const entry of req.headers.entries()) {
      this.headers[entry[0]] = entry[1];
    }

    this.method = req.method;

    const reqUrl = new URL(req.url);
    this.url = reqUrl.pathname.replace(oidcRouterPath, "") + reqUrl.search;
    this.originalUrl = reqUrl.pathname + reqUrl.search;

    this.socket = {
      encrypted: reqUrl.protocol.includes("https"),
    };

    this.length = reqBodyBytes.length;
    this.push(reqBodyBytes);
    this.push(null);
  }
}

export class NodeResponse {
  body?: string;
  readonly headers = new Headers();
  statusCode = 0;

  end(bodyText: string): void {
    this.body = bodyText;
  }

  getHeader(key: string): string | null {
    return this.headers.get(key);
  }

  setHeader(key: string, value: string | string[]): void {
    if (typeof value === "string") {
      this.headers.append(key, value);
    } else {
      for (const val of value) {
        this.headers.append(key, val);
      }
    }
  }

  removeHeader(key: string): void {
    this.headers.delete(key);
  }

  toResponse() {
    return new Response(this.body, {
      status: this.statusCode,
      headers: this.headers,
    });
  }
}
