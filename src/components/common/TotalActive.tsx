"use client";
import React from "react";
import { GroupIcon } from "@/icons";

interface DataFetch {
  total_active_users: number;
}

export const TotalActive = () => {
  const [data, setData] = React.useState<DataFetch | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/get_current_active_users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: 60 }),
      });

      const result: DataFetch = await res.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  React.useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 h-full">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Current Active
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-lg dark:text-white/90">
              {loading || !data ? "Loading..." : data.total_active_users}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};
