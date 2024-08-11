import { timingSafeEqual } from "@std/crypto";
import { Buffer } from "node:buffer";
import phc from "npm:@phc/format";
import { hash as argon2Hash } from "@denosaurs/argontwo";
import { nanoid } from "nanoid";

export function secureRandom(): string {
  return nanoid();
}

export function hash(password: string): Promise<string> {
  const encoder = new TextEncoder();

  // Store the salt and hash, this could be done with a PHC string or just as is.
  // Using a PHC string you would use the `phc.serialize` function to encode it
  const salt = new Uint8Array(40);
  crypto.getRandomValues(salt);
  const hash = argon2Hash(encoder.encode(password), salt); // XXX: Maybe change to an async algorithm???

  // Serializing as PHC, this is when you would want to store it in the database
  return Promise.resolve(phc.serialize({
    id: "argon2id",
    version: 19,
    params: {
      m: 4096,
      t: 3,
      p: 1,
    },
    salt: Buffer.from(salt),
    hash: Buffer.from(hash),
  }));
}

export function hashVerify(
  hashedPassword: string,
  presentedPassword: string,
): Promise<boolean> {
  const encoder = new TextEncoder();

  // Deserializing the PHC string, probably directly fetched from a database in a real-life scenario
  const { salt, hash: a } = phc.deserialize(hashedPassword);
  const b = argon2Hash(encoder.encode(presentedPassword), new Uint8Array(salt)); // XXX: Maybe change to an async algorithm???

  // Using timing safe equal protects against timing based attacks
  return Promise.resolve(timingSafeEqual(a, b));
}
