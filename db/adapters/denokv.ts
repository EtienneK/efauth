import { AbstractAdapter } from "./abstract.ts";

const _kv = await Deno.openKv();

export default class DenoKvAdapter<T> extends AbstractAdapter<T> {
  protected readonly kv = _kv;

  constructor(name: string, namespace: string) {
    super(name, namespace);
  }

  async upsert(id: string, payload: T, expireIn: number = -1) {
    const key = this.key(id);
    const atomic = this.kv.atomic();
    atomic.set(key, payload, {
      expireIn: expireIn >= 0 ? expireIn * 1000 : undefined,
    });
    this.upsertBeforeCommit(atomic, id, payload, expireIn);
    await atomic.commit();
  }

  protected upsertBeforeCommit(
    _atomic: Deno.AtomicOperation,
    _id: string,
    _payload: T,
    _expireIn: number,
  ) {
  }

  async find(id: string) {
    const data = await this.kv.get<T>(this.key(id));
    return data.value ?? undefined;
  }

  async destroy(id: string) {
    await this.kv.delete(this.key(id));
  }
}
