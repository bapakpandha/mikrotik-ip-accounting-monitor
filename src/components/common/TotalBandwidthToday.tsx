"use client";
import React from "react";
import { DownloadIcon, UploadIcon } from "@/icons";
import { formatBytes } from "@/utils/formatBytes";

interface DataFetch {
  total_tx_bytes_agg: number;
  total_rx_bytes_agg: number;
  total_tx_bytes_wan: number;
  total_rx_bytes_wan: number;
}

export const TotalBandwidthToday = () => {
  const [data, setData] = React.useState<DataFetch | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchData = async () => {
    try {
      const secondsSinceMidnight = Math.floor((Date.now() - new Date().setHours(0, 0, 0, 0)) / 1000);
      const res = await fetch("/api/get_total_bandwidth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: secondsSinceMidnight }),
      });

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 h-full">
      {/* Total Download */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DownloadIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Download Today
            </span>
            <h4 className="mt-2 text-lg font-bold text-gray-800 dark:text-white/90">
              {loading || !data
                ? "Loading..."
                : formatBytes(data.total_rx_bytes_agg, 3)}
            </h4>
          </div>
        </div>
      </div>

      {/* Total Upload */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <UploadIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Upload Today
            </span>
            <h4 className="mt-2 text-lg font-bold text-gray-800 dark:text-white/90">
              {loading || !data
                ? "Loading..."
                : formatBytes(data.total_tx_bytes_agg)}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};
