// @ts-types="npm:@types/config"
import config from "config";
// @ts-types="npm:@types/oidc-provider"
import Provider, { Configuration } from "oidc-provider";
import DenoKvAdapter from "./adapters/denokv.ts";

const configuration: Configuration = {
  adapter: DenoKvAdapter,
  clients: config.get("oidc.clients"),
};

export const oidc = new Provider(config.get("oidc.issuer"), configuration);
oidc.proxy = config.get("server.proxy");

oidc.on("server_error", (_ctx, err) => {
  console.error(err);
});
