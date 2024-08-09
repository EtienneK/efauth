import db from "./db/db.ts";
import { hash } from "./utils/credentials.ts";
import { secureRandom } from "./utils/credentials.ts";

const adminUsername = "admin";
let adminUser = await db.users.findByUsernameOrEmailCi(adminUsername);

if (adminUser) {
  // TODO: Remove this block
  await db.users.destroy(adminUser.id);
  adminUser = undefined;
}

if (!adminUser) {
  const adminEmail = "admin@example.com";
  const adminPassword = secureRandom();
  await db.users.upsert(secureRandom(), {
    username: adminUsername,
    email: adminEmail,
    password: await hash(adminPassword),
  });

  console.log("▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀");
  console.log(" Administrator user created");
  console.log(" ══════════════════════════");
  console.log(`   - Username: ${adminUsername}`);
  console.log(`   - Password: ${adminPassword}`);
  console.log("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄");
}
