// @ts-types="npm:@types/oidc-provider"
import { Adapter, AdapterPayload } from "oidc-provider";

const kv = await Deno.openKv();

const grantable = new Set([
  "AccessToken",
  "AuthorizationCode",
  "RefreshToken",
  "DeviceCode",
  "BackchannelAuthenticationRequest",
]);

function grantKeyPrefixFor(grantId: string) {
  return ["oidc", "_idx", "grant", grantId];
}

function grantKeyFor(grantId: string, payloadId: string) {
  const key = grantKeyPrefixFor(grantId);
  key.push(payloadId);
  return key;
}

function userCodeKeyFor(userCode: string) {
  return ["oidc", "_idx", "userCode", userCode];
}

function uidKeyFor(uid: string) {
  return ["oidc", "_idx", "uid", uid];
}

export default class DenoKvAdapter implements Adapter {
  constructor(private name: string) {
    this.name = name;
  }

  async upsert(id: string, payload: AdapterPayload, expireIn: number) {
    const key = this.key(id);

    const atomic = kv.atomic();

    atomic.set(key, payload, { expireIn: expireIn * 1000 });

    if (payload.grantId && grantable.has(this.name)) {
      atomic.set(grantKeyFor(payload.grantId, id), id, {
        expireIn: expireIn * 1000,
      });
    }

    if (payload.userCode) {
      atomic.set(userCodeKeyFor(payload.userCode), id, {
        expireIn: expireIn * 1000,
      });
    }

    if (payload.uid) {
      atomic.set(uidKeyFor(payload.uid), id, { expireIn: expireIn * 1000 });
    }

    await atomic.commit();
  }

  async find(id: string) {
    const data = await kv.get<AdapterPayload>(this.key(id));
    return data.value ?? undefined;
  }

  async findByUid(uid: string) {
    const id = await kv.get<string>(uidKeyFor(uid));
    if (!id.value) return undefined;
    return this.find(id.value);
  }

  async findByUserCode(userCode: string) {
    const id = await kv.get<string>(userCodeKeyFor(userCode));
    if (!id.value) return undefined;
    return this.find(id.value);
  }

  async destroy(id: string) {
    await kv.delete(this.key(id));
  }

  async revokeByGrantId(grantId: string) {
    const grantIndexEntries = kv.list<string>({
      prefix: grantKeyPrefixFor(grantId),
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
    return ["oidc", this.name, id];
  }
}
