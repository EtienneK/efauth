// @ts-types="npm:@types/oidc-provider"
import { Adapter, AdapterPayload } from "oidc-provider";
import { type Collection, collection, kvdex, model } from "@olli/kvdex";
import { AuthnSession, ClientSession, User } from "../../models/models.ts";
import { DbAdapter, UsersDbAdapter, WithId } from "../adapters.ts";
import { Db } from "../../db.ts";
import { ulid } from "@std/ulid";

const kv = await Deno.openKv();

const db = kvdex(kv, {
  app: {
    authnSessions: collection(AuthnSession),
    clientSessions: collection(ClientSession),
    users: collection(
      model((user: User) => ({
        ...user,
        usernameLowerCase: user.username.toLowerCase(),
        emailLowerCase: user.email.toLowerCase(),
      })),
      {
        indices: {
          usernameLowerCase: "primary",
          emailLowerCase: "primary",
        },
      },
    ),
  },
});

function _generateId(): string {
  return ulid();
}

class KvDexDbAdapter<T> implements DbAdapter<T> {
  // deno-lint-ignore no-explicit-any
  constructor(private collection: Collection<T, any, any>) {}

  generateId(): string {
    return _generateId();
  }

  async upsert(
    id: string,
    payload: T,
    expireIn: number = -1,
  ): Promise<void> {
    await this.collection.upsert(
      // deno-lint-ignore no-explicit-any
      { id, set: payload, update: payload as any },
      { expireIn: expireIn >= 0 ? expireIn * 1000 : undefined },
    );
  }

  async find(id: string): Promise<T & WithId | undefined> {
    const found = await this.collection.find(id);
    if (!found) return undefined;
    return {
      ...found.value,
      id: found.id,
    };
  }

  destroy(id: string): Promise<void> {
    return this.collection.delete(id);
  }
}

// ===========================================================================
// Users

class KvDexUsersDbAdapter extends KvDexDbAdapter<User>
  implements UsersDbAdapter {
  constructor() {
    super(db.app.users);
  }

  async findByUsernameOrEmailCi(
    usernameOrEmail: string,
  ): Promise<User & WithId | undefined> {
    let found = await db.app.users.findByPrimaryIndex(
      "usernameLowerCase",
      usernameOrEmail.toLowerCase(),
    );

    if (!found) {
      found = await db.app.users.findByPrimaryIndex(
        "emailLowerCase",
        usernameOrEmail.toLowerCase(),
      );
    }

    if (!found) return undefined;

    return {
      ...found.value,
      id: found.id,
    };
  }
}

// ===========================================================================
// OIDC

const grantable = new Set([
  "AccessToken",
  "AuthorizationCode",
  "RefreshToken",
  "DeviceCode",
  "BackchannelAuthenticationRequest",
]);

class OidcDenoKvDbAdapter implements Adapter {
  private namespace: string;

  constructor(private name: string) {
    this.namespace = "oidc";
  }

  async upsert(id: string, payload: AdapterPayload, expireIn: number = -1) {
    const key = this.key(id);
    const atomic = kv.atomic();
    atomic.set(key, payload, {
      expireIn: expireIn >= 0 ? expireIn * 1000 : undefined,
    });

    if (payload.grantId && grantable.has(this.name)) {
      atomic.set(this.grantKeyFor(payload.grantId, id), id, {
        expireIn: expireIn >= 0 ? expireIn * 1000 : undefined,
      });
    }

    if (payload.userCode) {
      atomic.set(this.userCodeKeyFor(payload.userCode), id, {
        expireIn: expireIn >= 0 ? expireIn * 1000 : undefined,
      });
    }

    if (payload.uid) {
      atomic.set(this.uidKeyFor(payload.uid), id, {
        expireIn: expireIn >= 0 ? expireIn * 1000 : undefined,
      });
    }

    await atomic.commit();
  }

  async find(id: string) {
    const data = await kv.get<AdapterPayload>(this.key(id));
    if (!data) return undefined;

    return {
      ...data.value,
      id,
    };
  }

  async destroy(id: string) {
    await kv.delete(this.key(id));
  }

  async findByUid(uid: string) {
    const id = await kv.get<string>(this.uidKeyFor(uid));
    if (!id.value) return undefined;
    return this.find(id.value);
  }

  async findByUserCode(userCode: string) {
    const id = await kv.get<string>(this.userCodeKeyFor(userCode));
    if (!id.value) return undefined;
    return this.find(id.value);
  }

  async revokeByGrantId(grantId: string) {
    const grantIndexEntries = kv.list<string>({
      prefix: this.grantKeyPrefixFor(grantId),
    });
    const atomic = kv.atomic();
    for await (const grantIndexEntry of grantIndexEntries) {
      atomic.delete(this.key(grantIndexEntry.value));
      atomic.delete(grantIndexEntry.key);
    }
    await atomic.commit();
  }

  async consume(id: string) {
    const payload = await this.find(id);
    if (!payload) return;
    payload.consumed = Date.now() / 1000;
    await kv.set(this.key(id), payload);
  }

  private key(id: string) {
    return [this.namespace, this.name, id];
  }

  private grantKeyPrefixFor(grantId: string) {
    return [this.namespace, "_idx", "grant", grantId];
  }

  private grantKeyFor(grantId: string, payloadId: string) {
    const key = this.grantKeyPrefixFor(grantId);
    key.push(payloadId);
    return key;
  }

  private userCodeKeyFor(userCode: string) {
    return [this.namespace, "_idx", "userCode", userCode];
  }

  private uidKeyFor(uid: string) {
    return [this.namespace, "_idx", "uid", uid];
  }
}

// ===========================================================================
// Export DB

const denokvDb: Db = {
  authnSessions: new KvDexDbAdapter(db.app.authnSessions),
  clientSessions: new KvDexDbAdapter(db.app.clientSessions),
  users: new KvDexUsersDbAdapter(),
  oidc: OidcDenoKvDbAdapter,
};

export default denokvDb;
