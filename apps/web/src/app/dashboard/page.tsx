'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays, CheckCircle2,
  Users, DollarSign, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Booking } from '@/components/booking-card';
import type { Analytics, Booking as ApiBooking } from '@/lib/api';
import { API_BASE } from '@/lib/api';

const AnalyticsChart = dynamic(
  () => import('@/components/analytics-chart').then(m => m.AnalyticsChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[rgba(0,0,0,0.03)] rounded-xl" /> }
);

type Range = 'week' | 'month' | 'quarter';

const STATUS_COLOR: Record<string, string> = {
  PENDING:   '#FF9500',
  CONFIRMED: '#007AFF',
  COMPLETED: '#34C759',
  CANCELLED: '#FF3B30',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

function Delta({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10.5px] font-semibold ${pos ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
      {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
}

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  delta: number;
  accent?: boolean;
  subtitle?: string;
  loading?: boolean;
}
function KpiCard({ icon: Icon, label, value, delta, accent, subtitle, loading }: KpiCardProps) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-black/[0.06] bg-white px-4 py-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent ? 'bg-[rgba(255,149,0,0.1)]' : 'bg-[rgba(0,0,0,0.04)]'}`}>
          <Icon className={`h-3.5 w-3.5 ${accent ? 'text-[#FF9500]' : 'text-[#6E6E73]'}`} strokeWidth={1.75} />
        </div>
        {loading ? <span className="h-4 w-10 rounded bg-[rgba(0,0,0,0.05)] animate-pulse" /> : <Delta value={delta} />}
      </div>
      <div>
        {loading
          ? <span className="block h-6 w-20 rounded bg-[rgba(0,0,0,0.05)] animate-pulse mb-1" />
          : <p className="text-[20px] font-bold tracking-[-0.03em] text-[#1C1C1E] leading-none">{value}</p>
        }
        <p className="mt-0.5 text-[10.5px] text-[#AEAEB2]">{label}</p>
        {subtitle && <p className="mt-0.5 text-[10px] text-[#C7C7CC]">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange]           = useState<Range>('week');
  const [showRev, setShowRev]       = useState(true);
  const [showBook, setShowBook]     = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [analytics, setAnalytics]   = useState<Analytics | null>(null);
  const [recent, setRecent]         = useState<Booking[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/businesses`)
      .then(r => r.json())
      .then((bs: Array<{ id: string }>) => { if (bs[0]) setBusinessId(bs[0].id); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`${API_BASE}/bookings/analytics?businessId=${businessId}&range=${range}`)
      .then(r => r.json())
      .then((data: Analytics) => { setAnalytics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [businessId, range]);

  useEffect(() => {
    if (!businessId) return;
    fetch(`${API_BASE}/bookings?businessId=${businessId}`)
      .then(r => r.json())
      .then((bs: ApiBooking[]) => {
        setRecent(bs.slice(0, 5).map(b => ({
          id:          b.id,
          clientPhone: b.client.phone,
          serviceName: b.service.name,
          scheduledAt: b.scheduledAt,
          status:      b.status,
          price:       Number(b.service.price),
        })));
      })
      .catch(console.error);
  }, [businessId]);

  const kpi              = analytics?.kpi;
  const chartData        = analytics?.chart ?? [];
  const serviceBreakdown = analytics?.serviceBreakdown ?? [];
  const statusDist       = analytics?.statusDistribution ?? {};
  const totalBookings    = kpi?.bookings ?? 1;

  const RANGE_LABEL: Record<Range, string> = { week: 'This Week',    month: 'This Month',    quarter: 'This Quarter'   };
  const RANGE_VS:    Record<Range, string> = { week: 'vs last week', month: 'vs last month', quarter: 'vs last quarter' };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F5F4EF]">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between border-b border-black/[0.06] bg-white px-6 h-[52px]">
        <div>
          <h1 className="text-[13px] font-semibold text-[#1C1C1E]">Overview</h1>
          <p className="text-[10.5px] text-[#AEAEB2]">
            {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-black/[0.08] bg-[#FAFAF8] p-0.5">
          {(['week', 'month', 'quarter'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${
                range === r
                  ? 'bg-white shadow-sm text-[#1C1C1E] border border-black/[0.06]'
                  : 'text-[#AEAEB2] hover:text-[#6E6E73]'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* KPI row */}
        <div className="flex gap-3">
          <KpiCard
            icon={DollarSign}
            label="Total Revenue"
            value={`KES ${(kpi?.revenue ?? 0).toLocaleString()}`}
            delta={kpi?.revDelta ?? 0}
            accent
            subtitle={RANGE_VS[range]}
            loading={loading}
          />
          <KpiCard
            icon={CalendarDays}
            label="Bookings"
            value={String(kpi?.bookings ?? 0)}
            delta={kpi?.bookDelta ?? 0}
            subtitle={RANGE_VS[range]}
            loading={loading}
          />
          <KpiCard
            icon={CheckCircle2}
            label="Completion Rate"
            value={`${kpi?.completion ?? 0}%`}
            delta={kpi?.compDelta ?? 0}
            subtitle="completed / total"
            loading={loading}
          />
          <KpiCard
            icon={Users}
            label="Unique Clients"
            value={String(kpi?.clients ?? 0)}
            delta={kpi?.clientDelta ?? 0}
            subtitle={RANGE_VS[range]}
            loading={loading}
          />
        </div>

        {/* Chart + Activity */}
        <div className="flex gap-3" style={{ minHeight: 320 }}>

          {/* Chart */}
          <div className="flex-1 rounded-xl border border-black/[0.06] bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5 shrink-0">
              <div>
                <p className="text-[12.5px] font-semibold text-[#1C1C1E]">Revenue & Bookings</p>
                <p className="text-[10.5px] text-[#AEAEB2]">{RANGE_LABEL[range]}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRev(p => !p)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors ${
                    showRev
                      ? 'bg-[rgba(255,149,0,0.08)] border-[rgba(255,149,0,0.2)] text-[#FF9500]'
                      : 'border-black/[0.06] text-[#AEAEB2]'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF9500]" />
                  Revenue
                </button>
                <button
                  onClick={() => setShowBook(p => !p)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors ${
                    showBook
                      ? 'bg-[rgba(0,122,255,0.06)] border-[rgba(0,122,255,0.15)] text-[#007AFF]'
                      : 'border-black/[0.06] text-[#AEAEB2]'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#007AFF]" />
                  Bookings
                </button>
              </div>
            </div>
            <div className="flex-1 px-4 py-4">
              <AnalyticsChart data={chartData} showRevenue={showRev} showBookings={showBook} />
            </div>
          </div>

          {/* Recent activity */}
          <div className="w-[240px] shrink-0 rounded-xl border border-black/[0.06] bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/[0.05] px-4 py-3.5 shrink-0">
              <p className="text-[12px] font-semibold text-[#1C1C1E]">Recent Activity</p>
              <Link
                href="/dashboard/bookings"
                className="flex items-center gap-0.5 text-[10px] text-[#AEAEB2] hover:text-[#FF9500] transition-colors"
              >
                All <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04]">
              {recent.length === 0 && (
                <div className="flex items-center justify-center h-20">
                  <p className="text-[11px] text-[#AEAEB2]">{businessId ? 'No bookings yet' : 'Loading…'}</p>
                </div>
              )}
              {recent.map((b) => {
                const dt  = new Date(b.scheduledAt);
                const col = STATUS_COLOR[b.status] ?? '#AEAEB2';
                return (
                  <Link
                    key={b.id}
                    href="/dashboard/bookings"
                    className="flex items-start gap-2.5 px-4 py-3 hover:bg-[rgba(0,0,0,0.02)] transition-colors"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-black/20 bg-white mt-0.5">
                      <span className="text-[9px] font-mono font-bold text-[#6E6E73]">
                        {b.clientPhone.slice(-4, -2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#1C1C1E] leading-tight truncate">{b.serviceName}</p>
                      <p className="text-[10px] text-[#AEAEB2] font-mono mt-0.5">+{b.clientPhone}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold" style={{ color: col }}>
                          <span className="h-1 w-1 rounded-full" style={{ background: col }} />
                          {STATUS_LABEL[b.status]}
                        </span>
                        <span className="text-[9.5px] text-[#C7C7CC]">
                          {dt.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex gap-3">

          {/* Service breakdown */}
          <div className="flex-1 rounded-xl border border-black/[0.06] bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
              <p className="text-[12.5px] font-semibold text-[#1C1C1E]">Service Breakdown</p>
              <span className="text-[10px] text-[#AEAEB2]">{RANGE_LABEL[range]}</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.04]">
                  {['Service', 'Bookings', 'Revenue', 'Completion'].map(h => (
                    <th key={h} className="px-5 py-2 text-left text-[9.5px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {serviceBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-4 text-[11px] text-[#AEAEB2]">
                      {loading ? 'Loading…' : 'No data for this period'}
                    </td>
                  </tr>
                ) : serviceBreakdown.map((row) => (
                  <tr key={row.service} className="hover:bg-[rgba(0,0,0,0.015)] transition-colors">
                    <td className="px-5 py-2.5 text-[11.5px] font-medium text-[#1C1C1E]">{row.service}</td>
                    <td className="px-5 py-2.5 text-[11.5px] text-[#6E6E73]">{row.bookings}</td>
                    <td className="px-5 py-2.5 text-[11.5px] font-medium text-[#1C1C1E]">KES {row.revenue.toLocaleString()}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-[rgba(0,0,0,0.06)]">
                          <div className="h-full rounded-full bg-[#34C759]" style={{ width: `${row.rate}%` }} />
                        </div>
                        <span className="text-[10.5px] font-medium text-[#6E6E73] w-7 text-right">{row.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Status distribution */}
          <div className="w-[220px] shrink-0 rounded-xl border border-black/[0.06] bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/[0.05] px-4 py-3.5">
              <p className="text-[12px] font-semibold text-[#1C1C1E]">By Status</p>
              <MoreHorizontal className="h-3.5 w-3.5 text-[#C7C7CC]" />
            </div>
            <div className="px-4 py-4 space-y-3">
              {[
                { label: 'Confirmed', key: 'CONFIRMED', color: '#007AFF' },
                { label: 'Pending',   key: 'PENDING',   color: '#FF9500' },
                { label: 'Completed', key: 'COMPLETED', color: '#34C759' },
                { label: 'Cancelled', key: 'CANCELLED', color: '#FF3B30' },
              ].map(({ label, key, color }) => {
                const count = statusDist[key] ?? 0;
                const pct   = Math.round((count / totalBookings) * 100);
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-[11px] text-[#6E6E73]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                        {label}
                      </span>
                      <span className="text-[11px] font-semibold text-[#1C1C1E]">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[rgba(0,0,0,0.05)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
