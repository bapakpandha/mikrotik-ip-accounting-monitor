"use client";

import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface DataPoint {
    tx_bytes: number;
    rx_bytes: number;
    period: string;
}

export default function StatisticsChart({ user_id = 1 }: { user_id?: number }) {

    const [data, setData] = React.useState<DataPoint[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/get_real_time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id, limit: 18 }),
            });
            const result = await res.json();

            const formatted = result
                .map((item: any) => ({
                    tx_bytes: Number(((item?.tx_bytes ?? 0) / 1024 / 1024).toFixed(2)), 
                    rx_bytes: Number(((item?.rx_bytes ?? 0) / 1024 / 1024).toFixed(2)),
                    period: item.period,
                }))
                .reverse();
            setData(formatted);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Fetch pertama + interval update tiap 10 detik
    React.useEffect(() => {
        fetchData();

        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/get_real_time', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id, limit: 1 }),
                });
                const result = await res.json();

                const tx = Number(((result[0]?.tx_bytes ?? 0) / 1024 / 1024).toFixed(2));
                const rx = Number(((result[0]?.rx_bytes ?? 0) / 1024 / 1024).toFixed(2));
                
                const newPoint = {
                    tx_bytes: isNaN(tx) ? 0 : tx,
                    rx_bytes: isNaN(rx) ? 0 : rx,
                    period: result[0]?.period ?? "",
                };

                setData(prev => [...prev.slice(1), newPoint]);
            } catch (e) {
                console.error('Live update failed:', e);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [user_id]);

    const options: ApexOptions = {
        legend: {
            show: true, // Hide legend
            position: "top",
            horizontalAlign: "left",
        },
        colors: ["#465FFF", "#9CB9FF"], // Define line colors
        chart: {
            fontFamily: "Outfit, sans-serif",
            height: 512,
            type: "line", // Set the chart type to 'line'
            toolbar: {
                show: false, // Hide chart toolbar
            },
            width: '90%',
            animations: {
                enabled: true,
                animateGradually: {
                    enabled: true,
                },
                dynamicAnimation: {
                  speed: 1000, // atau sesuai update interval kamu (misal 10000 ms untuk 10s)
                },
              },
            zoom: {
                enabled: false,
            }
        },
        stroke: {
            curve: "smooth", // Define the line style (straight, smooth, or step)
        },

        fill: {
            type: "gradient",
            gradient: {
                opacityFrom: 0.55,
                opacityTo: 0,
            },
        },
        markers: {
            size: 0, // Size of the marker points
            strokeColors: "#fff", // Marker border color
            strokeWidth: 2,
            hover: {
                size: 6, // Marker size on hover
            },
        },
        grid: {
            xaxis: {
                lines: {
                    show: false, // Hide grid lines on x-axis
                },
            },
            yaxis: {
                lines: {
                    show: true, // Show grid lines on y-axis
                },
            },
        },
        dataLabels: {
            enabled: true, // Disable data labels
        },
        tooltip: {
            enabled: true, // Enable tooltip
            x: {
                format: "dd MMM yyyy", // Format for x-axis tooltip
            },
        },
        xaxis: {
            type: "datetime",
            labels: {
                show: true,
                rotate: -60,
                rotateAlways: true,
                hideOverlappingLabels: false,
                showDuplicates: false,
                trim: false,
                minHeight: 60,
                maxHeight: undefined,
                style: {
                    colors: [],
                    fontSize: '12px',
                    fontWeight: 400,
                    cssClass: 'apexcharts-xaxis-label',
                },
                offsetX: 0,
                offsetY: 0,
                format: undefined,
                formatter: undefined,
                datetimeUTC: true,
                datetimeFormatter: {
                    year: 'yyyy',
                    month: "MMM 'yy",
                    day: 'dd MMM',
                    hour: 'HH:mm',
                    minute: 'HH:mm:ss',
                    second: 'HH:mm:ss',
                },
            },
            axisBorder: {
                show: true,
                color: '#78909C',
                offsetX: 0,
                offsetY: 0
            },
            axisTicks: {
                show: true,
                borderType: "dotted",
            },
            tooltip: {
                enabled: false, // Disable tooltip for x-axis points
            },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => {
                    if (isNaN(val)) return `0 MB`;
                    return `${val.toFixed(2)} MB`;
                },
                style: {
                    fontSize: "12px", // Adjust font size for y-axis labels
                    colors: ["#6B7280"], // Color of the labels
                },
            },
            title: {
                text: "",
                style: {
                    fontSize: "0px",
                },
            },
            stepSize: (Math.max(...data.flatMap(item => [item.tx_bytes, item.rx_bytes]))/10),
            tickAmount: 11,
        },
    };

    const series = [
        {
            name: 'Download',
            data: data.map(d => ({ x: d.period, y: d.rx_bytes })),
        },
        {
            name: 'Upload',
            data: data.map(d => ({ x: d.period, y: d.tx_bytes })),
        },
    ];

    return (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
                <div className="w-full">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Live Usage
                    </h3>
                </div>
            </div>
            <div className="max-w-full overflow-x-auto custom-scrollbar">
                {loading ? (
                    <div className="p-4 bg-gray-100 rounded dark:bg-white/[0.03] dark:text-white/90">Loading chart...</div>
                ) : (
                    <div className="min-w-full">
                        <ReactApexChart
                            options={options}
                            series={series}
                            type="area"
                            height={512}
                            width={"95%"}
                        />
                    </div>
                )}

            </div>

        </div>
    );
}
