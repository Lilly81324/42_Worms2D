import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';


const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is missing.');
  process.exit(1);
}

// Initialize the adapter so Prisma Client knows how to talk to Postgres in v7 standalone mode
const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking global chat infrastructure dependencies...');

  await prisma.$executeRawUnsafe(`
    ALTER TYPE "ChatThreadType" ADD VALUE IF NOT EXISTS 'GLOBAL';
  `);

  const systemUserId = '00000000-0000-0000-0000-000000000000';
  await prisma.userProfile.upsert({
    where: { userId: systemUserId },
    update: {},
    create: {
      userId: systemUserId,
      displayName: 'System',
    },
  });

  const globalThreadId = '99999999-9999-9999-9999-999999999999';
  await prisma.chatThread.upsert({
    where: { id: globalThreadId },
    update: {},
    create: {
      id: globalThreadId,
      type: 'GLOBAL',
      createdByUserId: systemUserId,
    },
  });

  console.log('Global chat environment variables seeded securely!');
}

main()
  .catch((e) => {
    console.error('Critical database seed validation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
