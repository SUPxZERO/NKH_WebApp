import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Package, TrendingUp } from 'lucide-react';
import { cn } from '@/app/utils/cn';

export interface Activity {
  id: number | string;
  type: 'order_placed' | 'order_delivered' | 'order_cancelled' | 'reward_earned' | 'points_added';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    amount?: number;
    points?: number;
    orderId?: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
  maxItems?: number;
}

const activityConfig = {
  order_placed: {
    icon: Package,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  order_delivered: {
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  order_cancelled: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
  reward_earned: {
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
  },
  points_added: {
    icon: TrendingUp,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ activities, loading = false, maxItems = 5 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayActivities.map((activity, index) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;

        return (
          <motion.div
            key={activity.id}
            className="flex gap-4 items-start"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Icon */}
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', config.bg)}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {activity.description}
                  </p>
                  {activity.metadata?.amount && (
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                      ${activity.metadata.amount.toFixed(2)}
                    </p>
                  )}
                  {activity.metadata?.points && (
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-1">
                      +{activity.metadata.points} points
                    </p>
                  )}
                </div>

                <time className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                  {formatRelativeTime(activity.timestamp)}
                </time>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default ActivityFeed;
