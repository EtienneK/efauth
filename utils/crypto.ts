import { timingSafeEqual } from "@std/crypto";
import { Buffer } from "node:buffer";
import phc from "npm:@phc/format";
import { hash as argon2Hash } from "@denosaurs/argontwo";
import { nanoid } from "nanoid";

const bitsPerSymbol = Math.log2(64); // nanoid alphabet is 64 characters
const tokenLength = (i: number) => Math.ceil(i / bitsPerSymbol);

export function secureId() {
  return secureRandom(128);
}

export function secureRandom(bitsOfOpaqueRandomness: number = 256): string {
  return nanoid(tokenLength(bitsOfOpaqueRandomness));
}

export function hash(password: string): Promise<string> {
  // See: https://github.com/denosaurs/argontwo/blob/main/examples/phc.ts

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
  // See: https://github.com/denosaurs/argontwo/blob/main/examples/phc.ts

  const encoder = new TextEncoder();

  // Deserializing the PHC string, probably directly fetched from a database in a real-life scenario
  const { salt, hash: a } = phc.deserialize(hashedPassword);
  const b = argon2Hash(encoder.encode(presentedPassword), new Uint8Array(salt)); // XXX: Maybe change to an async algorithm???

  // Using timing safe equal protects against timing based attacks
  return Promise.resolve(timingSafeEqual(a, b));
}
