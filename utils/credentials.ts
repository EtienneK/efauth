import * as argon2 from "argon2";
import { nanoid } from "nanoid";

export function secureRandom(): string {
  return nanoid();
}

export async function hash(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function hashVerify(
  hashedPassword: string,
  presentedPassword: string,
): Promise<boolean> {
  return await argon2.verify(hashedPassword, presentedPassword);
}
