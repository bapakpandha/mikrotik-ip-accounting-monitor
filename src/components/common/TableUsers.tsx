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
import { formatSmartDate } from "@/utils/formatSmartDate";
import { encodeId } from "@/utils/hashids";
import Link from "next/link";
import { usePathname } from 'next/navigation'

// API response from backend
interface ApiResponseItem {
    user_id: number;
    username: string;
    total_tx: number;
    total_rx: number;
    total_traffic: number;
    last_online: string;
}

// Local state shape
interface UserRow {
    user_id: number;
    username: string;
    upload: number;
    download: number;
    total_traffic: number;
    last_view: Date;
}

export default function TableUsers() {
    const [data, setData] = React.useState<UserRow[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [sortedBy, setSortedBy] = React.useState<keyof UserRow | null>(null);
    const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
        "asc"
    );

    const pathname = usePathname(); 

    const fetchData = async () => {
        try {
            const res = await fetch("/api/get_list_users", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            const result: ApiResponseItem[] = await res.json();

            const formatted: UserRow[] = result.map((item) => ({
                user_id: Number(item.user_id),
                username: item.username,
                upload: Number(item.total_tx),
                download: Number(item.total_rx),
                total_traffic: Number(item.total_traffic),
                last_view: new Date(item.last_online),
            }));

            setData(formatted);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch once + polling
    React.useEffect(() => {
        fetchData();

        const interval = setInterval(fetchData, 120000);
        return () => clearInterval(interval);
    }, []);

    // Sorting memoized
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
                        Users
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
                                    setSortedBy("username");
                                    setSortDirection((prev) =>
                                        prev === "asc" ? "desc" : "asc"
                                    );
                                }}
                            >
                                Username {sortedBy === "username" && (sortDirection === "asc" ? "↑" : "↓")}
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
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                onClick={() => {
                                    console.log(sortedBy, sortDirection);
                                    setSortedBy("last_view");
                                    setSortDirection((prev) =>
                                        prev === "asc" ? "desc" : "asc"
                                    );
                                }}
                            >
                                Last Seen {sortedBy === "last_view" && (sortDirection === "asc" ? "↑" : "↓")}
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
                                                <Link href={`${pathname}/user/${encodeId(user.user_id)}`}>{user.username}</Link> 
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
                                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                    {formatSmartDate(user.last_view)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}