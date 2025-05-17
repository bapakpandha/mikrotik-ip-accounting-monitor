import { PrismaClient } from 'generated';
import { z } from 'zod';

const prisma = new PrismaClient();

const schema = z.object({
    duration: z.coerce.number().min(1).default(60),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { duration } = schema.parse(body);

        const nowJakarta = new Date(Date.now() + 7 * 60 * 60 * 1000); // UTC+7 offset
        const durations = new Date(nowJakarta.getTime() - duration * 1000);

        const logs = await prisma.raw_bandwidth_logs.groupBy({
            by: ['user_id'],
            where: {
                timestamp: {
                    gte: durations,
                },
            },
            _sum: {
                tx_bytes: true,
                rx_bytes: true,
            },
            _max: {
                timestamp: true,
            },
        });

        const userIds = logs.map(log => log.user_id);
        const users = await prisma.users.findMany({
            where: {
                user_id: { in: userIds },
            },
            select: {
                user_id: true,
                username: true,
            },
        });

        const userMap = Object.fromEntries(users.map(user => [user.user_id, user.username]));
        
        const formatted = logs.map(log => ({
            username: userMap[log.user_id] || `User ${log.user_id}`,
            last_seen: log._max.timestamp,
            total_tx_bytes: Number(log._sum.tx_bytes ?? 0),
            total_rx_bytes: Number(log._sum.rx_bytes ?? 0),
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
