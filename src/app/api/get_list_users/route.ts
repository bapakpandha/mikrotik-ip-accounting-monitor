import { PrismaClient } from 'generated'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

interface RawResult {
  user_id: number
  username: string
  total_tx: bigint | number
  total_rx: bigint | number
  total_traffic: bigint | number
  last_online: Date | string | null
}

interface Result {
  user_id: number
  username: string
  total_tx: number
  total_rx: number
  total_traffic: number
  last_online: Date | null
}

export async function GET() {
  const raw: RawResult[] = await prisma.$queryRawUnsafe(`
    SELECT 
      u.user_id,
      u.username,
      agg.total_tx,
      agg.total_rx,
      agg.total_traffic,
      COALESCE(raw.last_raw_timestamp, agg.last_agg_timestamp) AS last_online
    FROM 
      users u
    LEFT JOIN (
      SELECT 
        user_id,
        SUM(total_tx_bytes) AS total_tx,
        SUM(total_rx_bytes) AS total_rx,
        SUM(total_tx_bytes + total_rx_bytes) AS total_traffic,
        MAX(interval_end) AS last_agg_timestamp
      FROM aggregated_bandwidth_logs_30min
      GROUP BY user_id
    ) agg ON u.user_id = agg.user_id
    LEFT JOIN (
      SELECT 
        user_id,
        MAX(timestamp) AS last_raw_timestamp
      FROM raw_bandwidth_logs
      GROUP BY user_id
    ) raw ON u.user_id = raw.user_id
    ORDER BY total_traffic DESC
  `)

  const result: Result[] = raw.map((row) => ({
    user_id: row.user_id,
    username: row.username,
    total_tx: Number(row.total_tx ?? 0),
    total_rx: Number(row.total_rx ?? 0),
    total_traffic: Number(row.total_traffic ?? 0),
    last_online: row.last_online ? new Date(row.last_online) : null,
  }))

  return NextResponse.json(result)
}
