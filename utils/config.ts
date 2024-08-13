// @ts-types="npm:@types/config"
import nodeConfig from "config";
import { z } from "zod";

const ConfigSchema = z.object({
  server: z.object({
    baseUrl: z.string().url().optional(),
    proxy: z.boolean().readonly(),
  }),
  oidc: z.object({
    issuer: z.string().url().optional(),
    clients: z.array(z.object({
      client_id: z.string(),
      client_secret: z.string(),
      redirect_uris: z.array(z.string().url()),
    })),
  }),
});

let _config = ConfigSchema.parse(nodeConfig.util.toObject());

export function config() {
  return structuredClone(_config);
}

export function setConfig(newConfig: z.infer<typeof ConfigSchema>) {
  _config = ConfigSchema.parse(newConfig);
}
