"use client";

import React, { useEffect, useState } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface DataPoint {
    upload_bytes: number;
    download_bytes: number;
    time: string | Date;
}

export function formatDateToLocalInput(date: Date): string {
    const pad = (n: number): string => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const bytesToMB = (bytes: number): number => {
    return bytes / 1024 / 1024;
};

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


    export default function UserTrafficBarChart({ user_id = 1 }: { user_id?: number }) {
        const now = new Date();
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(now.getDate() - 14);

        const [data, setData] = React.useState<DataPoint[]>([]);
        const [startDate, setStartDate] = useState(formatDateToLocalInput(fourteenDaysAgo));
        const [endDate, setEndDate] = useState(formatDateToLocalInput(now));
        const [scale, setScale] = useState('daily');
        const [loading, setLoading] = useState(false);

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
                if (json.status === 'success') {

                    const modifiedData = json.data.map((item: DataPoint) => {

                        const timeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
                        const localizedTime = fromZonedTime(item.time, 'UTC');

                        const formatted = formatTimeByScale(localizedTime, scale, timeZone);

                        return {
                            time: formatted,
                            upload_bytes: item.upload_bytes,
                            download_bytes: item.download_bytes,
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

        useEffect(() => {
            fetchData();
        }, []);

        const chartOptions: ApexOptions = {
            chart: {
                type: 'bar',
                stacked: false,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                    borderRadius: 0.5,
                    dataLabels: {
                        position: 'top',
                    },
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return Number(val).toFixed(0) + " MB";
                },
                offsetY: -20,
                style: {
                    fontSize: '12px',
                    colors: ["#304758"]
                }
            },
            xaxis: {
                categories: data.map((d) => d.time),
            },
            legend: {
                position: 'top',
            },
            fill: {
                opacity: 1,
            },
            yaxis: {
                title: {
                    text: 'Traffic (MB)', // Set the y-axis title
                },
                labels: {
                    formatter: (value: number) => {
                        return value.toFixed(0);
                    }
                },
                tickAmount: 11,
            },
            colors: ['#2563eb', '#16a34a'],
        };

        const chartSeries = [
            {
                name: 'Upload',
                // Convert bytes to KB for the chart data
                data: data.map((d) => bytesToMB(d.upload_bytes)),
            },
            {
                name: 'Download',
                // Convert bytes to KB for the chart data
                data: data.map((d) => bytesToMB(d.download_bytes)),
            },
        ];

        return (
            <div className="p-6 bg-white dark:bg-gray-800 shadow rounded-2xl w-full">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Traffic Graph</h2>
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
                <ReactApexChart
                    options={chartOptions}
                    series={chartSeries}
                    type="bar"
                    height={400}
                />
            </div>
        );
    }
