import {
  BuilderFn,
  type Collection,
  collection,
  CollectionOptions,
  kvdex,
  model,
} from "@olli/kvdex";
import { AuthnSession, ClientSession, User } from "../../models/models.ts";
import {
  Db,
  DbAdapter,
  OidcAdapter,
  OidcAdapterPayload,
  UsersDbAdapter,
  WithId,
} from "../adapters.ts";
import { z } from "zod";

const kv = await Deno.openKv();

const BaseModel = z.object({
  __id: z.string(),
});
type BaseModel = z.infer<typeof BaseModel>;

function genericCollection<
  const TInput extends BaseModel,
  const TOutput extends BaseModel = TInput,
>(
  transform?: (data: TInput) => TOutput,
  options?: CollectionOptions<TOutput>,
): BuilderFn<TInput, TOutput, CollectionOptions<TOutput>> {
  options = {
    ...options,
    indices: {
      ...options?.indices,
      __id: "primary",
    },
    // deno-lint-ignore no-explicit-any
  } as any;

  return collection(model(transform), options);
}

const db = kvdex(kv, {
  app: {
    authnSessions: genericCollection<AuthnSession & BaseModel>(),
    clientSessions: genericCollection<ClientSession & BaseModel>(),
    users: collection(
      model((user: User & BaseModel) => ({
        ...user,
        usernameLowerCase: user.username.toLowerCase(),
        emailLowerCase: user.email.toLowerCase(),
      })),
      {
        indices: {
          __id: "primary",
          usernameLowerCase: "primary",
          emailLowerCase: "primary",
        },
      },
    ),
  },
});

class KvDexDbAdapter<T> implements DbAdapter<T> {
  constructor(
    // deno-lint-ignore no-explicit-any
    private collection: Collection<T & BaseModel, any, any>,
  ) {}

  async upsert(
    id: string,
    payload: T,
    expireIn: number = -1,
  ): Promise<void> {
    await this.collection.upsertByPrimaryIndex(
      {
        // deno-lint-ignore no-explicit-any
        index: ["__id", id as any],
        set: { ...payload, __id: id },
        update: { ...payload } as any,
      },
      { expireIn: expireIn >= 0 ? expireIn * 1000 : undefined },
    );
  }

  async find(id: string): Promise<T & WithId | undefined> {
    // deno-lint-ignore no-explicit-any
    const found = await this.collection.findByPrimaryIndex("__id", id as any);
    if (!found) return undefined;
    return {
      ...found.value,
      id,
    };
  }

  destroy(id: string): Promise<void> {
    // deno-lint-ignore no-explicit-any
    return this.collection.deleteByPrimaryIndex("__id", id as any);
  }
}

// ===========================================================================
// Users

class KvDexUsersDbAdapter extends KvDexDbAdapter<User & BaseModel>
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
      id: found.value.__id,
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

class OidcDenoKvDbAdapter implements OidcAdapter {
  private namespace: string;

  constructor(private name: string) {
    this.namespace = "oidc";
  }

  async upsert(id: string, payload: OidcAdapterPayload, expireIn: number = -1) {
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
    const data = await kv.get<OidcAdapterPayload>(this.key(id));
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
