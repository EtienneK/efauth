import db from "./db/db.ts";
import { hash, secureId, secureRandom } from "./utils/crypto.ts";

const adminUsername = "admin";
const adminUser = await db.users.findByUsernameOrEmailCi(adminUsername);

// TODO: Don't override admin user on each restart
const adminEmail = "admin@example.com";
const adminPassword = "admin"; // secureRandom();
const adminId = adminUser?.id ?? secureId();

await db.users.upsert(adminId, {
  username: adminUsername,
  email: adminEmail,
  password: await hash(adminPassword),
});

console.log("▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀");
console.log(" Administrator user created");
console.log(" ══════════════════════════");
console.log(`   - ID:       ${adminId}`);
console.log(`   - Username: ${adminUsername}`);
console.log(`   - Password: ${adminPassword}`);
console.log("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄");
