import { AbstractAdapter } from "./abstract.ts";

const kv = await Deno.openKv();

export default class DenoKvAdapter<T> extends AbstractAdapter<T> {
  constructor(name: string, namespace: string) {
    super(name, namespace);
  }

  async upsert(id: string, payload: T, expireIn: number) {
    const key = this.key(id);
    const atomic = kv.atomic();
    atomic.set(key, payload, { expireIn: expireIn * 1000 });
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
    const data = await kv.get<T>(this.key(id));
    return data.value ?? undefined;
  }

  async destroy(id: string) {
    await kv.delete(this.key(id));
  }
}
