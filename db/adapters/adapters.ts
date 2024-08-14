// @ts-types="npm:@types/oidc-provider"
import {
  Adapter,
  AdapterConstructor,
  AdapterFactory,
  AdapterPayload,
} from "oidc-provider";
import type { AuthnSession, ClientSession, User } from "../models/models.ts";

export interface WithId {
  id: string;
}

export interface DbAdapter<T> {
  upsert(id: string, payload: T): Promise<void>;
  upsert(id: string, payload: T, expireIn: number): Promise<void>;
  find(id: string): Promise<T & WithId | undefined>;
  destroy(id: string): Promise<void>;
}

export interface UsersDbAdapter extends DbAdapter<User> {
  findByUsernameOrEmailCi(username: string): Promise<User & WithId | undefined>;
}

export interface Db {
  authnSessions: DbAdapter<AuthnSession>;
  clientSessions: DbAdapter<ClientSession>;
  users: UsersDbAdapter;

  oidc: AdapterConstructor | AdapterFactory;
}

export type OidcAdapter = Adapter;
export type OidcAdapterConstructor = AdapterConstructor;
export type OidcAdapterFactory = AdapterFactory;
export type OidcAdapterPayload = AdapterPayload;
