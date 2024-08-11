import { hash as argon2Hash } from "@denosaurs/argontwo";
import { nanoid } from "nanoid";

export function secureRandom(): string {
  return nanoid();
}

export async function hash(password: string): Promise<string> {
  return ""; // TODO
  //return await argon2Hash(password);
}

export async function hashVerify(
  hashedPassword: string,
  presentedPassword: string,
): Promise<boolean> {
  return false; // TODO
  //return await argon2.verify(hashedPassword, presentedPassword);
}
