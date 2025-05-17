import type { Metadata } from "next";
import { TotalActive } from "@/components/common/TotalActive";
import { TotalBandwidthToday } from "@/components/common/TotalBandwidthToday";
import StatisticsChart from "@/components/common/StatisticCharts";
import TableCurrentOnline from "@/components/common/TableCurrentOnline";

export const metadata: Metadata = {
  title:
    "Mikrotik IP Accounting Monitor",
  description: "Mikrotik IP Accounting Monitor for Monitoring traffic and Online Users",
};

export default function Home() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-4 self-stretch">
        <TotalActive />
      </div>
      <div className="col-span-8 self-stretch">
        <TotalBandwidthToday />
      </div>
      <div className="col-span-12">
        <StatisticsChart />
      </div>
      <div className="col-span-12">
        <TableCurrentOnline />
      </div>
    </div>
  );
}
