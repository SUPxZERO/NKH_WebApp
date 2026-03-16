import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface SalesChartProps {
    data: {
        date: string;
        total_revenue: number;
        order_count: number;
        average_order_value: number;
    }[];
    height?: number;
}

export function SalesChart({ data, height = 350 }: SalesChartProps) {
    if (!data || data.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-muted-foreground bg-slate-50 border border-dashed rounded-md"
                style={{ height }}
            >
                No sales data available for the selected period
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart
                data={data}
                margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                }}
            >
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => {
                        // Optional: Format date string
                        const date = new Date(value);
                        return date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                        });
                    }}
                    className="text-xs text-muted-foreground"
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    className="text-xs text-muted-foreground"
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area
                    type="monotone"
                    dataKey="total_revenue"
                    stroke="#4f46e5"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
