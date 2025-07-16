import { PrismaClient } from 'generated';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe('SELECT 1 + 1 AS result');
    console.log(result);
  } catch (e) {
    console.error(e);
  } finally {
    console.log('Disconnecting now...');
    prisma.$disconnect();
    console.log('Disconnected!');
  }
}

main()
  .then(() => setTimeout(() => prisma.$disconnect, 1000)) // beri waktu 100ms
  .catch((e) => {
    console.error("Unhandled error:", e);
  });
