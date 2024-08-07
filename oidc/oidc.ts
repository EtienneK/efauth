// @ts-types="npm:@types/config"
import config from "config";
// @ts-types="npm:@types/oidc-provider"
import Provider, { Configuration } from "oidc-provider";
import DenoKvAdapter from "./adapters/denokv.ts";
import { Readable } from "node:stream";

const configuration: Configuration = {
  adapter: DenoKvAdapter,
  clients: config.get("oidc.clients"),
  interactions: {
    url(_ctx, interaction) {
      return `/interactions/${interaction.uid}`;
    },
  },
  features: {
    devInteractions: { enabled: false },
    pushedAuthorizationRequests: { enabled: false },
    resourceIndicators: { enabled: false },
    rpInitiatedLogout: { enabled: false },
    userinfo: { enabled: false },
  },
};

export const oidc = new Provider(config.get("oidc.issuer"), configuration);
oidc.proxy = config.get("server.proxy");

oidc.on("server_error", (_ctx, err) => {
  console.error(err);
});

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
    this.url = reqUrl.pathname.replace("/api/oidc", "") + reqUrl.search;
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
