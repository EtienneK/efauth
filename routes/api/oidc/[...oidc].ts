import { FreshContext } from "$fresh/server.ts";

// @ts-types="npm:@types/oidc-provider"
import Provider from "oidc-provider";

// ===================================================================================
// OIDC

const configuration = {
  // refer to the documentation for other available configuration
  clients: [{
    client_id: "foo",
    client_secret: "bar",
    redirect_uris: ["http://lvh.me:8080/cb"],
    // ... other client properties
  }],
};

export const oidc = new Provider("http://localhost:8000", configuration);
oidc.proxy = false; // TODO

oidc.on("server_error", (_ctx, err) => {
  console.error(err);
});

const oidcCallback = oidc.callback();

// ===================================================================================
// Adapters

export type NodeRequest = {
  headers: Record<string, string>;
  method: string | null;
  originalUrl: string | null;
  url: string | null;
  socket: {
    encrypted: boolean;
    // address(): {
    //   addr: null | {
    //     address: string;
    //   };
    // };
  };
  // on(
  //   method: "data" | "error" | "end",
  //   listener: (arg: Uint8Array | Error | undefined) => void,
  // ): void;
};

export type NodeResponse = {
  // destroy(error?: Error): void;
  end(bodyText: string): void;

  setHeader(key: string, value: string): void;
  getHeader(key: string): string | null;
  removeHeader(key: string): void;

  // write(chunk: unknown, callback?: (err: Error | null) => void): void;
  // writeHead(status: number, statusText?: string): void;
  statusCode: number;
};

// ===================================================================================
// Handler

export const handler = async (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const headers: Record<string, string> = {};
  for (const entry of req.headers.entries()) {
    headers[entry[0]] = entry[1];
  }

  // Request
  const reqUrl = new URL(req.url);
  const nodeRequest: NodeRequest = {
    headers,
    method: req.method,
    url: reqUrl.pathname.replace("/api/oidc", "") + reqUrl.search,
    originalUrl: reqUrl.pathname + reqUrl.search,
    socket: {
      encrypted: reqUrl.protocol.includes("https"),
    },
  };

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
