import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Head } from '@inertiajs/react';
import {
    Activity,
    TrendingUp,
    Clock,
    DollarSign,
    Star,
    Award
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { apiGet } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';

export default function Performance() {
    // Fetch stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['employeePerformance'],
        queryFn: async () => {
            const res = await apiGet('/api/employee/performance') as any;
            // return res.data or just res depending on wrapper
            // The controller returns direct JSON response()->json(...) without 'data' wrapper if not using Resource class
            // But usually axios (apiGet) returns data directly if interceptor extracts it.
            // If apiGet returns response.data, then this is the object.
            return res;
        },
    });

    const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={cn("p-3 rounded-xl bg-opacity-10", colorClass)}>
                <Icon className={cn("w-6 h-6", colorClass.replace('bg-', 'text-'))} />
            </div>
        </div>
    );

    return (
        <EmployeeLayout>
            <Head title="Performance" />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Activity className="w-8 h-8 text-fuchsia-500" />
                            Performance Dashboard
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Track your metrics, earnings, and achievements
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <span className="text-slate-500">Loading metrics...</span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    title="Hours Worked"
                                    value={stats?.hours_worked + 'h'}
                                    subtext={`Goal: ${stats?.hours_goal}h / week`}
                                    icon={Clock}
                                    colorClass="text-blue-600 bg-blue-600"
                                />
                                <StatCard
                                    title="Estimated Earnings"
                                    value={`$${stats?.earnings}`}
                                    subtext="Includes base wage only"
                                    icon={DollarSign}
                                    colorClass="text-green-600 bg-green-600"
                                />
                                <StatCard
                                    title="Tips Earned"
                                    value={`$${stats?.tips}`}
                                    subtext="Estimated from sales"
                                    icon={TrendingUp}
                                    colorClass="text-purple-600 bg-purple-600"
                                />
                                <StatCard
                                    title="Feedback Rating"
                                    value={stats?.rating > 0 ? stats?.rating : 'N/A'}
                                    subtext={`Top ${stats?.rank_percentile}% of staff`}
                                    icon={Star}
                                    colorClass="text-amber-500 bg-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Chart Section */}
                                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">Weekly Activity</h3>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats?.chart_data}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#64748b' }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#64748b' }}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#f1f5f9' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                                                    {stats?.chart_data?.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={index === new Date().getDay() - 1 ? '#d946ef' : '#94a3b8'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Achievements / Goals */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Achievements</h3>
                                        <Award className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { title: "Early Bird", desc: "Clocked in on time 5 days in a row", icon: "🌅", active: true },
                                            { title: "Service Star", desc: "Maintained 5.0 rating for a week", icon: "⭐", active: false },
                                            { title: "Speedster", desc: "Completed 50 orders in one shift", icon: "⚡", active: false },
                                        ].map((badge, idx) => (
                                            <div key={idx} className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg border",
                                                badge.active
                                                    ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                                                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-60"
                                            )}>
                                                <div className="text-2xl">{badge.icon}</div>
                                                <div>
                                                    <h4 className={cn("font-medium text-sm", badge.active ? "text-amber-900 dark:text-amber-100" : "text-slate-700 dark:text-slate-300")}>{badge.title}</h4>
                                                    <p className="text-xs text-slate-500">{badge.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </EmployeeLayout>
    );
}
