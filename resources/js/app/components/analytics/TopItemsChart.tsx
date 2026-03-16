import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface TopItemsChartProps {
    data: {
        name: string;
        id: number;
        total_quantity_sold: number;
        total_revenue_generated: number;
    }[];
    height?: number;
}

export function TopItemsChart({ data, height = 350 }: TopItemsChartProps) {
    if (!data || data.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-muted-foreground bg-slate-50 border border-dashed rounded-md"
                style={{ height }}
            >
                No product data available for the selected period
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{
                    top: 5,
                    right: 30,
                    left: 40,
                    bottom: 5,
                }}
                barSize={32}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    width={150}
                    className="text-xs font-medium text-slate-700"
                />
                <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any, name: any) => {
                        if (name === "total_revenue_generated") return [`$${Number(value).toFixed(2)}`, "Revenue"];
                        if (name === "total_quantity_sold") return [value, "Quantity Sold"];
                        return [value, name];
                    }}
                />
                <Bar
                    dataKey="total_revenue_generated"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    name="Revenue"
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
