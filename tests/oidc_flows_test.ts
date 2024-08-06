import { createHandler, ServeHandlerInfo } from "$fresh/server.ts";
import manifest from "../fresh.gen.ts";
import config from "../fresh.config.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("OIDC tests", async (t) => {
  const handler = await createHandler(manifest, config);

  await t.step("GET .well-known/openid-configuration", async () => {
    const res = await tfetch("/api/oidc/.well-known/openid-configuration");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(
      body.authorization_endpoint,
      "http://auth.example.com/api/oidc/auth",
    );
  });

  await t.step("POST /token", async () => {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "this_is_an_invalid_code",
    }).toString();

    const resp = await tfetch("/api/oidc/token", {
      method: "POST",
      body,
      headers: {
        "Authorization": "Basic " + btoa("foo:bar"),
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": body.length + "",
      },
    });

    assertEquals(resp.status, 400);
    const respJson = await resp.json();
    assertEquals(respJson.error, "invalid_grant");
    assertEquals(respJson.error_description, "grant request is invalid");
  });
});

const CONN_INFO: ServeHandlerInfo = {
  remoteAddr: { hostname: "127.0.0.1", port: 53496, transport: "tcp" },
};

const handler = await createHandler(manifest, config);
async function tfetch(path: string, init?: RequestInit) {
  const req = new Request(
    "http://" + CONN_INFO.remoteAddr.hostname + path,
    {
      ...init,
      headers: {
        host: "auth.example.com",
        ...init?.headers,
      },
    },
  );
  return await handler(req, CONN_INFO);
}
