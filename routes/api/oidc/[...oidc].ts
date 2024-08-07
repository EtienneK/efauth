import { FreshContext } from "$fresh/server.ts";
import { Readable } from "node:stream";
import { oidc } from "../../../oidc/oidc.ts";

const oidcCallback = oidc.callback();

// ===================================================================================
// Adapters

class NodeRequest extends Readable {
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

type NodeResponse = {
  end(bodyText: string): void;

  setHeader(key: string, value: string): void;
  getHeader(key: string): string | null;
  removeHeader(key: string): void;

  statusCode: number;
};

// ===================================================================================
// Handler

export const handler = async (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  // Request
  const nodeRequest = new NodeRequest(req, await req.bytes());

  // Response
  const resHeaders = new Headers();
  let resBody: string | undefined = undefined;
  const nodeResponse: NodeResponse = {
    statusCode: 0,
    setHeader: function (key: string, value: string): void {
      resHeaders.set(key, value);
    },
    end: function (bodyText: string): void {
      resBody = bodyText;
    },
    getHeader: function (key: string): string | null {
      return resHeaders.get(key);
    },
    removeHeader: function (key: string): void {
      resHeaders.delete(key);
    },
  };

  // deno-lint-ignore no-explicit-any
  await oidcCallback(nodeRequest as any, nodeResponse as any);

  return new Response(resBody, {
    status: nodeResponse.statusCode,
    headers: resHeaders,
  });
};
