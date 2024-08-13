// @ts-types="npm:@types/oidc-provider"
import { AdapterConstructor, AdapterFactory } from "oidc-provider";
import { DbAdapter, UsersDbAdapter, WithId } from "./adapters/adapters.ts";
import { AuthnSession, ClientSession } from "./models/models.ts";
import { z } from "zod";
import { User } from "./models/models.ts";

export interface Db {
  authnSessions: DbAdapter<AuthnSession>;
  clientSessions: DbAdapter<ClientSession>;
  users: UsersDbAdapter;

  oidc: AdapterConstructor | AdapterFactory;
}

const adapter = "kvdex";
const delegate: Db = (await import(`./adapters/${adapter}/index.ts`))?.default;

class ValidationDbAdapter<T> implements DbAdapter<T> {
  constructor(
    protected delegate: DbAdapter<T>,
    protected validator: z.Schema<T>,
  ) {}
  generateId(): string {
    return this.delegate.generateId();
  }
  upsert(id: string, payload: T, expireIn: number = -1): Promise<void> {
    return this.delegate.upsert(id, this.validator.parse(payload), expireIn);
  }
  find(id: string): Promise<(T & WithId) | undefined> {
    return this.delegate.find(id);
  }
  destroy(id: string): Promise<void> {
    return this.delegate.destroy(id);
  }
}

class UsersValidationDbAdapter extends ValidationDbAdapter<User>
  implements UsersDbAdapter {
  constructor(protected delegate: UsersDbAdapter) {
    super(delegate, User);
  }

  findByUsernameOrEmailCi(
    username: string,
  ): Promise<(User & WithId) | undefined> {
    return this.delegate.findByUsernameOrEmailCi(username);
  }
}

const db: Db = {
  authnSessions: new ValidationDbAdapter(delegate.authnSessions, AuthnSession),
  clientSessions: new ValidationDbAdapter(
    delegate.clientSessions,
    ClientSession,
  ),
  users: new UsersValidationDbAdapter(delegate.users),
  oidc: delegate.oidc,
};

export default db;
