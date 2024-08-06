import { createHandler, ServeHandlerInfo } from "$fresh/server.ts";
import manifest from "../fresh.gen.ts";
import config from "../fresh.config.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("HTTP assert test.", async (t) => {
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

  await t.step("#2 POST /", async () => {
    const formData = new FormData();
    formData.append("text", "Deno!");
    const req = new Request("http://127.0.0.1/", {
      method: "POST",
      body: formData,
    });
    const resp = await handler(req, CONN_INFO);
    assertEquals(resp.status, 303);
  });

  await t.step("#3 GET /foo", async () => {
    const resp = await handler(new Request("http://127.0.0.1/foo"), CONN_INFO);
    const text = await resp.text();
    assert(text.includes("<div>Hello Foo!</div>"));
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
