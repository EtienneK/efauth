export interface Adapter<T> {
  upsert(id: string, payload: T, expireIn: number): Promise<void>;
  find(id: string): Promise<T | undefined>;
  destroy(id: string): Promise<void>;
}

export abstract class AbstractAdapter<T> implements Adapter<T> {
  constructor(
    protected readonly name: string,
    protected readonly namespace: string,
  ) {}

  abstract upsert(id: string, payload: T, expireIn: number): Promise<void>;
  abstract find(id: string): Promise<T | undefined>;
  abstract destroy(id: string): Promise<void>;

  protected key(id: string) {
    return [this.namespace, this.name, id];
  }
}
