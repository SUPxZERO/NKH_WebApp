import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface RevenuePoint { label: string; value: number }

interface Props {
  data: RevenuePoint[];
}

export default function RevenueLine({ data }: Props) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="label" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <YAxis stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: 'rgba(17,17,17,0.9)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
          />
          <Line type="monotone" dataKey="value" stroke="#e879f9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
