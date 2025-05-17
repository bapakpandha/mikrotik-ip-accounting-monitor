import { PrismaClient } from 'generated';
import { z } from 'zod';

const prisma = new PrismaClient();

const schema = z.object({
  duration: z.coerce.number().min(1).default(86400),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { duration } = schema.parse(body);

    const nowJakarta = new Date(Date.now() + 7 * 60 * 60 * 1000); // UTC+7 offset
    const durations = new Date(nowJakarta.getTime() - duration * 1000);

    const data_tbl_agg = await prisma.aggregated_bandwidth_logs_30min.aggregate({
      where: {
        user_id: 1,
        interval_start: {
          lte: nowJakarta,
          gte: durations,
        }
      },
      _sum: {
        total_tx_bytes: true,
        total_rx_bytes: true,
      }
    });

    const data_tbl_WAN = await prisma.traffic.aggregate({
      where: {
        device_id: 1,
        timestamp: {
          lte: nowJakarta,
          gte: durations,
        }
      },
      _sum: {
        tx: true,
        rx: true,
      }
    });

    const formatted = {
      total_tx_bytes_agg: Number(data_tbl_agg._sum.total_tx_bytes ?? 0),
      total_rx_bytes_agg: Number(data_tbl_agg._sum.total_rx_bytes ?? 0),
      total_tx_bytes_wan: Number(data_tbl_WAN._sum.tx ?? 0),
      total_rx_bytes_wan: Number(data_tbl_WAN._sum.rx ?? 0),
    };

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
