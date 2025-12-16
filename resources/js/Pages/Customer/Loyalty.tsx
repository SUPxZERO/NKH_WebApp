import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Award,
    Star,
    TrendingUp,
    Gift,
    Calendar,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { apiGet } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';

const TIERS = {
    bronze: { name: 'Bronze', color: 'from-orange-700 to-orange-800', icon: '🥉', next: 'silver', threshold: 2000 },
    silver: { name: 'Silver', color: 'from-gray-400 to-gray-500', icon: '🥈', next: 'gold', threshold: 5000 },
    gold: { name: 'Gold', color: 'from-yellow-500 to-yellow-600', icon: '🥇', next: 'platinum', threshold: 10000 },
    platinum: { name: 'Platinum', color: 'from-purple-600 to-purple-700', icon: '💎', next: null, threshold: null },
};

export default function Loyalty() {
    // Fetch loyalty stats
    const { data: loyaltyStatsData } = useQuery({
        queryKey: ['customer', 'loyalty', 'stats'],
        queryFn: () => apiGet('/api/customer/loyalty/stats')
    });

    // Fetch loyalty transaction history
    const { data: loyaltyHistoryData } = useQuery({
        queryKey: ['customer', 'loyalty', 'history'],
        queryFn: () => apiGet('/api/customer/loyalty/history')
    });

    const stats = loyaltyStatsData?.data;
    const loyaltyTransactions = loyaltyHistoryData?.data || [];

    const currentTier = stats?.current_tier || 'bronze';
    const tierInfo = TIERS[currentTier as keyof typeof TIERS];
    const nextTier = stats?.next_tier ? TIERS[stats.next_tier as keyof typeof TIERS] : null;

    const progress = stats?.progress_to_next_tier || 0;

    return (
        <CustomerLayout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Award className="w-8 h-8 text-purple-600" />
                        Loyalty Program
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Track your rewards and unlock exclusive benefits
                    </p>
                </div>

                {/* Tier Status Card */}
                <Card className="overflow-hidden">
                    <div className={cn("h-2 bg-gradient-to-r", tierInfo?.color)} />
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Current Tier */}
                            <div className="text-center">
                                <div className="text-6xl mb-3">{tierInfo?.icon}</div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {tierInfo?.name} Member
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Current Tier
                                </p>
                            </div>

                            {/* Points Balance */}
                            <div className="text-center border-l border-r border-gray-200 dark:border-gray-700 px-6">
                                <div className="text-5xl font-bold text-purple-600 mb-2">
                                    {stats?.points_balance || 0}
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    <Star className="w-4 h-4 inline mr-1" />
                                    Points Available
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    = ${((stats?.points_balance || 0) * 0.01).toFixed(2)} in value
                                </p>
                            </div>

                            {/* Lifetime Spend */}
                            <div className="text-center">
                                <div className="text-5xl font-bold text-green-600 mb-2">
                                    ${parseFloat(stats?.lifetime_spend || 0).toFixed(0)}
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    <TrendingUp className="w-4 h-4 inline mr-1" />
                                    Lifetime Spend
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    {stats?.total_orders || 0} orders
                                </p>
                            </div>
                        </div>

                        {/* Progress to Next Tier */}
                        {nextTier && stats?.next_tier_threshold && (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Progress to {nextTier.name}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        ${parseFloat(stats?.lifetime_spend || 0).toFixed(0)} / ${stats?.next_tier_threshold || 0}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        className={cn("h-full bg-gradient-to-r", nextTier.color)}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(progress, 100)}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-2">
                                    ${((stats?.next_tier_threshold || 0) - parseFloat(stats?.lifetime_spend || 0)).toFixed(0)} more to unlock {nextTier.name} tier!
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tier Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(TIERS).map(([key, tier]) => (
                        <Card key={key} className={cn(
                            "border-2",
                            currentTier === key ? "border-purple-500" : "border-transparent"
                        )}>
                            <CardContent className="p-4 text-center">
                                <div className="text-3xl mb-2">{tier.icon}</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {tier.name}
                                </h3>
                                {tier.threshold && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        ${tier.threshold}+ spend
                                    </p>
                                )}
                                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                                    {key === 'bronze' && '• 1 point per $1\n• Birthday reward'}
                                    {key === 'silver' && '• 1.5x points\n• Free delivery\n• Priority support'}
                                    {key === 'gold' && '• 2x points\n• Exclusive menu items\n• VIP events'}
                                    {key === 'platinum' && '• 3x points\n• Personal concierge\n• Complimentary upgrades'}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Points History */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            <Calendar className="w-5 h-5 inline mr-2" />
                            Points History
                        </h2>

                        <div className="space-y-3">
                            {loyaltyTransactions.slice(0, 20).map((transaction: any) => (
                                <motion.div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            transaction.type === 'earn'
                                                ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                                                : "bg-red-100 dark:bg-red-900/20 text-red-600"
                                        )}>
                                            {transaction.type === 'earn' ? (
                                                <ArrowUp className="w-5 h-5" />
                                            ) : (
                                                <ArrowDown className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {transaction.type === 'earn' ? 'Points Earned' : (
                                                    transaction.type === 'redeem' ? 'Points Redeemed' : 'Points Adjusted'
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(transaction.occurred_at).toLocaleDateString()}
                                                {transaction.description && ` • ${transaction.description}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-lg font-semibold",
                                            transaction.points > 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                            {transaction.points > 0 ? '+' : ''}{transaction.points}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Balance: {transaction.balance_after}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {loyaltyTransactions.length === 0 && (
                                <div className="text-center py-12">
                                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No points history yet. Start ordering to earn points!
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* How to Earn Points */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            <Gift className="w-5 h-5 inline mr-2" />
                            How to Earn Points
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                                <div className="text-2xl mb-2">🛍️</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Place Orders
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Earn 1-3 points per $1 spent based on your tier
                                </p>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                                <div className="text-2xl mb-2">📝</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Write Reviews
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Earn 50 bonus points for each review
                                </p>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                                <div className="text-2xl mb-2">🎂</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Birthday Bonus
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Get 200 points on your birthday month
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
