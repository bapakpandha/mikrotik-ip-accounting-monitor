import { PrismaClient } from 'generated';
import { NextResponse } from 'next/server'

const prisma = new PrismaClient();
export async function GET() {
    const users = await prisma.users.findMany({
      select: {
        user_id: true,
        username: true,
        aggregated_bandwidth_logs_30min: {
          select: {
            total_tx_bytes: true,
            total_rx_bytes: true,
            interval_end: true,
          }
        },
        raw_bandwidth_logs: {
          select: {
            timestamp: true,
          }
        }
      }
    })
  
    const results = users.map(user => {
      const total_tx = user.aggregated_bandwidth_logs_30min.reduce((acc, log) => acc + Number(log.total_tx_bytes), 0)
      const total_rx = user.aggregated_bandwidth_logs_30min.reduce((acc, log) => acc + Number(log.total_rx_bytes), 0)
      const total_traffic = total_tx + total_rx
  
      const last_raw = user.raw_bandwidth_logs
      .map(log => log.timestamp)
      .reduce((latest, ts) => !latest || ts > latest ? ts : latest, null as Date | null)
    
    const last_agg = user.aggregated_bandwidth_logs_30min
      .map(log => log.interval_end)
      .reduce((latest, ts) => !latest || ts > latest ? ts : latest, null as Date | null)

  
      const last_online = last_raw ?? last_agg
  
      return {
        user_id: user.user_id,
        username: user.username,
        total_tx,
        total_rx,
        total_traffic,
        last_online
      }
    })
  
    // Sort by total_traffic descending
    results.sort((a, b) => b.total_traffic - a.total_traffic)
  
    return NextResponse.json(results)
  }