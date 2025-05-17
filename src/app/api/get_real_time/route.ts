import { PrismaClient } from 'generated';
import { z } from 'zod';

const prisma = new PrismaClient();

const schema = z.object({
  user_id: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { user_id, limit } = schema.parse(body);

    const data = await prisma.raw_bandwidth_logs.findMany({
      where: { user_id },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        users: true,
      },
    });

    const formatted = data.map(log => ({
      username: log.users?.username,
      tx_bytes: Number(log.tx_bytes),
      rx_bytes: Number(log.rx_bytes),
      period: log.timestamp,
    }));

    return new Response(JSON.stringify(formatted), {
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
