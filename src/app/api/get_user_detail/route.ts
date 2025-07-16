// @/api/get_user_detail/route.ts
import { z } from 'zod';
import prisma from '@/utils/db';
import { NextRequest } from 'next/server';
import { parseISO, format, addHours, addDays, addMonths, isBefore, isAfter, startOfHour, startOfDay } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime, getTimezoneOffset } from 'date-fns-tz';

// Skema umum request
const baseSchema = z.object({
    type: z.enum(['total_traffic', 'upload_download', 'traffic_graph', 'traffic_table']),
    user_id: z.number().min(1, 'User ID must be a positive integer'),
});

// Tipe lanjutan untuk graph dan table
const detailSchema = z.object({
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
    scale: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
});

// Pagination opsional untuk table
const paginationSchema = z.object({
    page: z.number().min(1).default(1),
    per_page: z.number().min(1).max(100).default(10),
}).partial();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, user_id } = baseSchema.parse(body);

        // Simulasikan handler berdasarkan tipe
        switch (type) {
            case 'total_traffic': {
                const totalBytes = await getTotalTraffic(user_id);
                return success({ total_bytes: totalBytes });
            }
            case 'upload_download': {
                const { upload, download } = await getUploadDownload(user_id);
                return success({ upload_total_bytes: upload, download_total_bytes: download });
            }
            case 'traffic_graph': {
                const { start_time, end_time, scale } = detailSchema.parse(body);
                const data = await getTrafficGraph(user_id, start_time, end_time, scale);
                return success(data);
            }
            case 'traffic_table': {
                const { start_time, end_time, scale } = detailSchema.parse(body);
                const { page = 1, per_page = 10 } = paginationSchema.parse(body);
                const data = await getTrafficTable(user_id, start_time, end_time, scale, page, per_page);
                return success(data);
            }
            default:
                return error('Unsupported type');
        }
    } catch (err: any) {
        return error(err.message || 'Unexpected error');
    }
}

// Helper untuk response
function success(data: any) {
    return new Response(JSON.stringify({
        status: 'success',
        message: 'Request successful',
        data,
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

function error(message: string) {
    return new Response(JSON.stringify({
        status: 'failed',
        message,
        data: null,
    }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
    });
}

async function getTotalTraffic(user_id: number): Promise<number> {
    try {
        const user = await prisma.users.findUnique({
            where: { user_id },
            select: { user_id: true },
        });

        if (!user) {
            throw new Error(`User with ID ${user_id} not found`);
        }

        const result = await prisma.aggregated_bandwidth_logs_30min.aggregate({
            where: { user_id },
            _sum: {
                total_tx_bytes: true,
                total_rx_bytes: true,
            },
        });

        const tx = BigInt(result._sum.total_tx_bytes ?? BigInt(0));
        const rx = BigInt(result._sum.total_rx_bytes ?? BigInt(0));

        return Number(tx + rx);
    } catch (error) {
        console.error('getTotalTraffic error:', error);
        throw error;
    }
}

async function getUploadDownload(user_id: number): Promise<{ upload: number; download: number }> {
    try {
        const user = await prisma.users.findUnique({
            where: { user_id },
            select: { user_id: true },
        });

        if (!user) {
            throw new Error(`User with ID ${user_id} not found`);
        }

        const now = new Date();
        const localNow = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7
        const startOfToday = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()));
        const startUTC = new Date(startOfToday.getTime() - 7 * 60 * 60 * 1000); // convert back to UTC

        const result = await prisma.aggregated_bandwidth_logs_30min.aggregate({
            where: {
                user_id,
                interval_start: {
                    gte: startOfToday,
                },
            },
            _sum: {
                total_tx_bytes: true,
                total_rx_bytes: true,
            },
        });

        const upload = Number(result._sum.total_tx_bytes ?? BigInt(0));
        const download = Number(result._sum.total_rx_bytes ?? BigInt(0));

        return { upload, download };
    } catch (error) {
        console.error('getUploadDownload error:', error);
        throw error;
    }
}

async function getTrafficGraph(user_id: number, start: string, end: string, scale: string) {
    const startUtc = parseISO(start);
    const endUtc = parseISO(end);

    // Assuming DB stores in local time, and post requests are in UTC, so we need to adjust the dates
    const startLocal = new Date(startUtc.getTime() + getTimezoneOffset(Intl.DateTimeFormat().resolvedOptions().timeZone));
    const endLocal = new Date(endUtc.getTime() + getTimezoneOffset(Intl.DateTimeFormat().resolvedOptions().timeZone));

    if (isAfter(startLocal, endLocal)) {
        throw new Error('Start date must be before end date');
    }

    const data: { interval_end: Date; total_tx_bytes: bigint; total_rx_bytes: bigint }[] = await prisma.aggregated_bandwidth_logs_30min.findMany({
        where: {
            user_id,
            interval_end: {
                gte: startLocal,
                lte: endLocal,
            },
        },
        select: {
            interval_end: true,
            total_tx_bytes: true,
            total_rx_bytes: true,
        },
    });

    let bucketStart = startLocal;
    const result: {
        time: string;
        upload_bytes: number;
        download_bytes: number;
    }[] = [];

    while (isBefore(bucketStart, endLocal) || +bucketStart === +endLocal) {
        const bucketEnd = getNextDate(bucketStart, scale);

        const bucketData = data.filter((entry) => {
            return entry.interval_end >= bucketStart && entry.interval_end < bucketEnd;
        });

        const uploadSum = bucketData.reduce((acc, cur) => acc + Number(cur.total_tx_bytes), 0);
        const downloadSum = bucketData.reduce((acc, cur) => acc + Number(cur.total_rx_bytes), 0);

        console.log(`uploadSum: ${uploadSum}, downloadSum: ${downloadSum} | bucketStart: ${bucketStart.toISOString()}, bucketEnd: ${bucketEnd.toISOString()} | local: ${bucketStart} | format: ${formatTimeByScale(bucketStart, scale)}`);

        result.push({
            time: formatTimeByScale(bucketStart, scale),
            upload_bytes: uploadSum,
            download_bytes: downloadSum,
        });

        bucketStart = bucketEnd;
    }

    return result;
}

async function getTrafficTable(
    user_id: number,
    start: string,
    end: string,
    scale: string,
    page: number,
    per_page: number,
) {
    return {
        current_page: page,
        per_page,
        total_pages: 3,
        records: [
            { time: start, upload_bytes: 1000, download_bytes: 2000 },
            { time: end, upload_bytes: 1500, download_bytes: 3000 },
        ],
    };
}

function formatTimeByScale(date: Date, scale: string) {
    const dateUTC = new Date(date.getTime() - getTimezoneOffset(Intl.DateTimeFormat().resolvedOptions().timeZone));
    const timeZone = 'UTC';
    switch (scale) {
        case 'hourly':
            return formatInTimeZone(dateUTC, timeZone, 'yyyy-MM-dd HH:00:00');
        case 'daily':
            return formatInTimeZone(dateUTC, timeZone, 'yyyy-MM-dd');
        case 'weekly':
            return formatInTimeZone(dateUTC, timeZone, 'yyyy-MM-dd');
        case 'monthly':
            return formatInTimeZone(dateUTC, timeZone, 'yyyy, MMMM');
        default:
            throw new Error(`Unknown scale: ${scale}`);
    }
}

function getNextDate(date: Date, scale: string): Date {
    switch (scale) {
        case 'hourly': return addHours(date, 1);
        case 'daily': return addDays(date, 1);
        case 'weekly': return addDays(date, 7);
        case 'monthly': return addMonths(date, 1);
        default: throw new Error(`Invalid scale: ${scale}`);
    }
}

