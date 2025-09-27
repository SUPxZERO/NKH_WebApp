import type { ReactNode } from 'react';

type Props = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
};

export default function StatsCard({ title, value, icon, trend }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="text-primary/40 text-3xl">{icon}</div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
