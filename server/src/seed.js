// One-off script to create the first admin user and default settings row.
// Run with: npm run seed
// Reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from env, or falls back to
// sensible defaults you should change immediately after first login.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("./db");

async function main() {
  const name = process.env.ADMIN_NAME || "Admin";
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "changeme123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists, skipping admin creation.`);
  } else {
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, password: hash, role: "admin" },
    });
    console.log(`Created admin user: ${email} / ${password} (please change the password after first login)`);
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    await prisma.settings.create({ data: { id: 1 } });
    console.log("Created default settings row.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
