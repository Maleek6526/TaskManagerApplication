const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  const {
    ADMIN_USERNAME,
    ADMIN_PASSWORD,
    USER_USERNAME,
    USER_PASSWORD,
  } = process.env;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !USER_USERNAME || !USER_PASSWORD) {
    throw new Error('Missing required env: ADMIN_USERNAME, ADMIN_PASSWORD, USER_USERNAME, USER_PASSWORD');
  }

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const userPasswordHash = await bcrypt.hash(USER_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: { username: ADMIN_USERNAME, passwordHash: adminPasswordHash, role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { username: USER_USERNAME },
    update: {},
    create: { username: USER_USERNAME, passwordHash: userPasswordHash, role: 'USER' },
  });

  await prisma.task.create({
    data: {
      title: 'Welcome Task',
      description: 'This is your first task.',
      createdById: admin.id,
    },
  });

  console.log('Seed complete');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });