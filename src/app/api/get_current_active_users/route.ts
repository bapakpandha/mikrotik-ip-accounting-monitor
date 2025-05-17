import { PrismaClient, Prisma } from 'generated';
import { z } from 'zod';

const prisma = new PrismaClient();

const schema = z.object({
  time: z.coerce.number().min(1).default(60),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { time } = schema.parse(body);

    const result = await prisma.$queryRaw<
      { total_active_users: number }[]
    >(Prisma.sql`
      SELECT COUNT(DISTINCT user_id) AS total_active_users
      FROM raw_bandwidth_logs
      WHERE timestamp >= NOW() - INTERVAL ${time} SECOND
    `);

    const total = Number(result[0]?.total_active_users || 0);

    return new Response(JSON.stringify({ total_active_users: total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}
