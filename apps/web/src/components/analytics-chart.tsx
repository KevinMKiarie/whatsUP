'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface DataPoint {
  label: string;
  revenue: number;
  bookings: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white shadow-lg px-3.5 py-2.5 min-w-[140px]">
      <p className="text-[10.5px] font-semibold text-[#AEAEB2] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-[11.5px]">
          <span className="flex items-center gap-1.5 text-[#6E6E73]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            {p.name === 'revenue' ? 'Revenue' : 'Bookings'}
          </span>
          <span className="font-semibold text-[#1C1C1E]">
            {p.name === 'revenue' ? `KES ${p.value.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  data: DataPoint[];
  showRevenue: boolean;
  showBookings: boolean;
}

export function AnalyticsChart({ data, showRevenue, showBookings }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF9500" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#FF9500" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#007AFF" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#007AFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#AEAEB2', fontFamily: 'system-ui' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#AEAEB2', fontFamily: 'system-ui' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1 }} />
        {showRevenue && (
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#FF9500"
            strokeWidth={2}
            fill="url(#gradRevenue)"
            dot={false}
            activeDot={{ r: 4, fill: '#FF9500', strokeWidth: 0 }}
          />
        )}
        {showBookings && (
          <Area
            type="monotone"
            dataKey="bookings"
            stroke="#007AFF"
            strokeWidth={2}
            fill="url(#gradBookings)"
            dot={false}
            activeDot={{ r: 4, fill: '#007AFF', strokeWidth: 0 }}
            yAxisId={showRevenue ? undefined : 0}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
