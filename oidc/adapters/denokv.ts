// @ts-types="npm:@types/oidc-provider"
import { Adapter, AdapterPayload } from "oidc-provider";
import DenoKvAdapter from "../../db/adapters/denokv.ts";

const grantable = new Set([
  "AccessToken",
  "AuthorizationCode",
  "RefreshToken",
  "DeviceCode",
  "BackchannelAuthenticationRequest",
]);

export default class OidcDenoKvAdapter extends DenoKvAdapter<AdapterPayload>
  implements Adapter {
  constructor(name: string) {
    super(name, "oidc");
  }

  override upsertBeforeCommit(
    atomic: Deno.AtomicOperation,
    id: string,
    payload: AdapterPayload,
    expireIn: number,
  ) {
    if (payload.grantId && grantable.has(this.name)) {
      atomic.set(this.grantKeyFor(payload.grantId, id), id, {
        expireIn: expireIn * 1000,
      });
    }

    if (payload.userCode) {
      atomic.set(this.userCodeKeyFor(payload.userCode), id, {
        expireIn: expireIn * 1000,
      });
    }

    if (payload.uid) {
      atomic.set(this.uidKeyFor(payload.uid), id, {
        expireIn: expireIn * 1000,
      });
    }
  }

  async findByUid(uid: string) {
    const id = await this.kv.get<string>(this.uidKeyFor(uid));
    if (!id.value) return undefined;
    return this.find(id.value);
  }

  async findByUserCode(userCode: string) {
    const id = await this.kv.get<string>(this.userCodeKeyFor(userCode));
    if (!id.value) return undefined;
    return this.find(id.value);
  }

  async revokeByGrantId(grantId: string) {
    const grantIndexEntries = this.kv.list<string>({
      prefix: this.grantKeyPrefixFor(grantId),
    });
    const atomic = this.kv.atomic();
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
    await this.kv.set(this.key(id), payload);
  }

  protected grantKeyPrefixFor(grantId: string) {
    return [this.namespace, "_idx", "grant", grantId];
  }

  protected grantKeyFor(grantId: string, payloadId: string) {
    const key = this.grantKeyPrefixFor(grantId);
    key.push(payloadId);
    return key;
  }

  protected userCodeKeyFor(userCode: string) {
    return [this.namespace, "_idx", "userCode", userCode];
  }

  protected uidKeyFor(uid: string) {
    return [this.namespace, "_idx", "uid", uid];
  }
}
