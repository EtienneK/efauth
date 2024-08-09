// @ts-types="npm:@types/oidc-provider"
import { AdapterConstructor, AdapterFactory } from "oidc-provider";
import { DbAdapter, UsersDbAdapter } from "./adapters/adapters.ts";
import { AuthnSession } from "./models/models.ts";

export interface Db {
  authnSessions: DbAdapter<AuthnSession>;
  users: UsersDbAdapter;

  oidc: AdapterConstructor | AdapterFactory;
}

const adapter = "kvdex";
const db: Db = (await import(`./adapters/${adapter}/index.ts`))?.default;
export default db;
