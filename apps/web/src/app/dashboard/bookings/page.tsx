'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { BookingCard, type Booking } from '@/components/booking-card';
import { BookingDetail, BookingDetailEmpty } from '@/components/booking-detail';
import type { Booking as ApiBooking } from '@/lib/api';
import { API_BASE } from '@/lib/api';

const FILTERS = ['All', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
type Filter = typeof FILTERS[number];

const FILTER_LABEL: Record<Filter, string> = {
  All: 'All', PENDING: 'Pending', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

export default function BookingsPage() {
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [selected, setSelected]   = useState<Booking | null>(null);
  const [filter, setFilter]       = useState<Filter>('All');
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/businesses`)
      .then(r => r.json())
      .then((bs: Array<{ id: string }>) => {
        const id = bs[0]?.id;
        if (!id) return;
        return fetch(`${API_BASE}/bookings?businessId=${id}`).then(r => r.json());
      })
      .then((bs?: ApiBooking[]) => {
        if (!bs) return;
        const mapped: Booking[] = bs.map(b => ({
          id:          b.id,
          clientPhone: b.client.phone,
          serviceName: b.service.name,
          scheduledAt: b.scheduledAt,
          status:      b.status,
          price:       Number(b.service.price),
        }));
        setBookings(mapped);
        setSelected(mapped[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    let list = filter === 'All' ? bookings : bookings.filter(b => b.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(b =>
        b.serviceName.toLowerCase().includes(q) || b.clientPhone.includes(q)
      );
    }
    return list;
  }, [bookings, filter, query]);

  const counts = useMemo(() => ({
    pending:   bookings.filter(b => b.status === 'PENDING').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  }), [bookings]);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Center column ── */}
      <div className="flex w-[300px] shrink-0 flex-col border-r border-black/[0.06] bg-white overflow-hidden">

        {/* Header */}
        <div className="shrink-0 border-b border-black/[0.06] px-4 h-[52px] flex items-center justify-between">
          <div>
            <span className="text-[12.5px] font-semibold text-[#1C1C1E]">All Bookings</span>
            <span className="ml-2 text-[10px] text-[#AEAEB2]">{bookings.length} total</span>
          </div>
          <button className="flex items-center gap-1 rounded-lg bg-[#FF9500] px-2.5 py-1.5 text-[10.5px] font-semibold text-white hover:bg-[#E68900] transition-colors">
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-3 py-2.5 border-b border-black/[0.06]">
          <div className="flex items-center gap-2 rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-2.5 py-1.5">
            <Search className="h-3 w-3 text-[#AEAEB2] shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-[11.5px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="shrink-0 flex gap-1 px-3 py-2 border-b border-black/[0.06] overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                filter === f
                  ? 'bg-[#FF9500] text-white'
                  : 'bg-[rgba(0,0,0,0.04)] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.07)]'
              }`}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-[11.5px] text-[#AEAEB2]">Loading…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-[11.5px] text-[#AEAEB2]">No results</p>
            </div>
          ) : (
            visible.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                selected={selected?.id === b.id}
                onClick={() => setSelected(b)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Summary strip */}
        <div className="shrink-0 h-[52px] border-b border-black/[0.06] bg-[#F5F4EF] px-5 flex items-center gap-3">
          {[
            { label: 'Pending',   count: counts.pending,   color: '#FF9500' },
            { label: 'Confirmed', count: counts.confirmed, color: '#007AFF' },
            { label: 'Completed', count: counts.completed, color: '#34C759' },
            { label: 'Cancelled', count: counts.cancelled, color: '#FF3B30' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-1.5 rounded-lg border border-black/[0.06] bg-white px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[10.5px] font-semibold text-[#1C1C1E]">{count}</span>
              <span className="text-[10px] text-[#AEAEB2]">{label}</span>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-hidden">
          {selected
            ? <BookingDetail booking={selected} />
            : <BookingDetailEmpty />
          }
        </div>
      </div>

    </div>
  );
}
