import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title:     string;
  value:     string | number;
  subtitle?: string;
  icon:      LucideIcon;
  trend?:    'up' | 'down' | 'neutral';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">{value}</p>
          {subtitle && (
            <p className={cn('mt-1 text-xs', trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-zinc-400')}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-zinc-50 p-2.5">
          <Icon className="h-5 w-5 text-zinc-600" />
        </div>
      </div>
    </div>
  );
}
