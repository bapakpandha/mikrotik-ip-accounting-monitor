"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import React from "react";
import { formatBytes } from "@/utils/formatBytes";
import { formatDateToLocalInput } from "@/components/common/UserTrafficBarChart";
import { toZonedTime, formatInTimeZone, fromZonedTime } from "date-fns-tz";

interface ApiResponseItem {
    upload_bytes: number;
    download_bytes: number;
    time: string | Date;
}

interface UserRow {
    nomor: number;
    time: string | Date;
    upload: number;
    download: number;
    total_traffic: number;
}

function formatTimeByScale(date: Date, scale: string, timeZone: string = 'UTC') {
    switch (scale) {
        case 'hourly':
            return formatInTimeZone(date, timeZone, 'yyyy-MM-dd HH:00:00');
        case 'daily':
            return formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
        case 'weekly':
            return formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
        case 'monthly':
            return formatInTimeZone(date, timeZone, 'yyyy, MMMM');
        default:
            throw new Error(`Unknown scale: ${scale}`);
    }
}

export default function UserTableUsage({ user_id = 1 }: { user_id?: number }) {
    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const [data, setData] = React.useState<UserRow[]>([]);
    const [startDate, setStartDate] = React.useState(formatDateToLocalInput(fourteenDaysAgo));
    const [endDate, setEndDate] = React.useState(formatDateToLocalInput(now));
    const [scale, setScale] = React.useState('daily');
    const [loading, setLoading] = React.useState(true);
    const [sortedBy, setSortedBy] = React.useState<keyof UserRow | null>(null);
    const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
        "asc"
    );
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/get_user_detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'traffic_graph',
                    user_id: user_id,
                    start_time: new Date(startDate).toISOString(),
                    end_time: new Date(endDate).toISOString(),
                    scale,
                }),
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.message || 'Failed to fetch data');
            }

            if (json.status === 'success') {

                const modifiedData = json.data.map((item: ApiResponseItem, index: number) => {

                    const timeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
                    const utcTimeWithoutTZ = item.time instanceof Date ? item.time : new Date(item.time);
                    const localizedTime = fromZonedTime(utcTimeWithoutTZ, 'UTC');                
        
                    // Format tampilannya
                    const formatted = formatTimeByScale(localizedTime, scale, timeZone);
            
                    return {
                        nomor: index + 1,
                        time: formatted, // tampilkan waktu lokal sesuai client
                        upload: item.upload_bytes,
                        download: item.download_bytes,
                        total_traffic: item.upload_bytes + item.download_bytes,
                    };
                });

                setData(modifiedData);

            } else {
                console.error(json.message);
            }
        } catch (error) {
            console.error('Error fetching traffic data:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const sortedData = React.useMemo(() => {
        if (!sortedBy) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortedBy];
            const bVal = b[sortedBy];

            if (aVal instanceof Date && bVal instanceof Date) {
                return sortDirection === "asc"
                    ? aVal.getTime() - bVal.getTime()
                    : bVal.getTime() - aVal.getTime();
            }

            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortDirection === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            if (typeof aVal === "number" && typeof bVal === "number") {
                return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
            }

            return 0;
        });
    }, [data, sortedBy, sortDirection]);


    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Traffic Table
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
                        <svg
                            className="stroke-current fill-white dark:fill-gray-800"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M2.29004 5.90393H17.7067"
                                stroke=""
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M17.7075 14.0961H2.29085"
                                stroke=""
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                                fill=""
                                stroke=""
                                strokeWidth="1.5"
                            />
                            <path
                                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                                fill=""
                                stroke=""
                                strokeWidth="1.5"
                            />
                        </svg>
                        Filter
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
                        See all
                    </button>
                </div>
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    fetchData();
                }}
                className="flex flex-wrap items-end gap-4 mb-6"
            >
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                    <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border p-2 rounded w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                    <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border p-2 rounded w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scale</label>
                    <select
                        value={scale}
                        onChange={(e) => setScale(e.target.value)}
                        className="border p-2 rounded w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Update'}
                    </button>
                </div>
            </form>
            <div className="max-w-full overflow-x-auto">
                <Table>
                    {/* Table Header */}
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                No.
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                onClick={() => {
                                    console.log(sortedBy, sortDirection);
                                    setSortedBy("time");
                                    setSortDirection((prev) =>
                                        prev === "asc" ? "desc" : "asc"
                                    );
                                }}
                            >
                                Time {sortedBy === "time" && (sortDirection === "asc" ? "↑" : "↓")}
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                onClick={() => {
                                    setSortedBy("upload");
                                    setSortDirection((prev) =>
                                        prev === "asc" ? "desc" : "asc"
                                    );
                                }}
                            >
                                Upload {sortedBy === "upload" && (sortDirection === "asc" ? "↑" : "↓")}
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                onClick={() => {
                                    setSortedBy("download");
                                    setSortDirection((prev) =>
                                        prev === "asc" ? "desc" : "asc"
                                    );
                                }}
                            >
                                Download {sortedBy === "download" && (sortDirection === "asc" ? "↑" : "↓")}
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                onClick={() => {
                                    setSortedBy("total_traffic");
                                    setSortDirection((prev) =>
                                        prev === "asc" ? "desc" : "asc"
                                    );
                                }}
                            >
                                Total Traffic {sortedBy === "total_traffic" && (sortDirection === "asc" ? "↑" : "↓")}
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    {/* Table Body */}

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {sortedData.map((user, i) => (
                            <TableRow key={i} className="">
                                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                    {i + 1}.
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                {user.time instanceof Date
                                                    ? user.time.toLocaleString()
                                                    : user.time}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                    {formatBytes(user.upload)}
                                </TableCell>
                                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                    {formatBytes(user.download)}
                                </TableCell>
                                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                    {formatBytes(user.total_traffic)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};