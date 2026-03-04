const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt"); // keep require

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@test.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin created:", admin);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });