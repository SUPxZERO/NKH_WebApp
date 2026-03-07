import React from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, ShoppingBag, Users } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface BranchStat {
    id: number;
    name: string;
    orders_today: number;
    revenue_today: number;
    employee_count: number;
}

interface BranchOverviewWidgetProps {
    branches: BranchStat[];
}

export const BranchOverviewWidget: React.FC<BranchOverviewWidgetProps> = ({ branches }) => {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    if (!branches || branches.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
        >
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-gray-900/50 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Multi-Branch Performance</h3>
                        <p className="text-xs text-gray-400">Live overview across all active locations</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                            <th className="px-6 py-4">Branch Name</th>
                            <th className="px-6 py-4 text-center">Orders Today</th>
                            <th className="px-6 py-4 text-center">Revenue Today</th>
                            <th className="px-6 py-4 text-center">Staff On Duty</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {branches.map((branch, index) => (
                            <motion.tr
                                key={branch.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="hover:bg-white/5 transition-colors group"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                        {branch.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                                        <span className="text-gray-200">{branch.orders_today}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="font-mono text-emerald-400 font-bold">
                                            {formatCurrency(branch.revenue_today)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2 text-gray-300">
                                        <Users className="w-3.5 h-3.5 text-blue-400" />
                                        <span>{branch.employee_count}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Online
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
    );
};

export default BranchOverviewWidget;
