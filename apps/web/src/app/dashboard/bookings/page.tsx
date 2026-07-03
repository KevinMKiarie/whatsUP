'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { BookingCard, type Booking } from '@/components/booking-card';
import { BookingDetail, BookingDetailEmpty } from '@/components/booking-detail';
import type { Booking as ApiBooking, Business } from '@/lib/api';
import { API_BASE } from '@/lib/api';
import { Calendar as DateCalendar, TimePicker } from '@/components/date-time-picker';

function NewBookingModal({ business, onClose, onCreated }: {
  business: Business;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [phone, setPhone]       = useState('');
  const [serviceId, setServiceId] = useState(business.services[0]?.id ?? '');
  const [date, setDate]         = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime]         = useState('10:00');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !serviceId || !date) { setError('All fields are required.'); return; }
    setSaving(true); setError('');
    try {
      const [hh, mm] = time.split(':');
      const scheduledAt = new Date(`${date}T${hh}:${mm}:00`).toISOString();
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, clientPhone: phone.trim(), serviceId, scheduledAt }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d?.message ?? 'Failed'); }
      onCreated();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-white shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <p className="text-[13px] font-semibold text-[#1C1C1E]">New Booking</p>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
            <X className="h-4 w-4 text-[#6E6E73]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Client phone */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-1.5">Client Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+254700000000"
              className="w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] px-3 py-2.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] transition-all placeholder-[#AEAEB2] font-mono"
            />
          </div>

          {/* Service */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-1.5">Service</label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] px-3 py-2.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 transition-all appearance-none"
            >
              {business.services.map(s => (
                <option key={s.id} value={s.id}>{s.name} — KES {s.price}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-2">Date</label>
            <DateCalendar value={date} onChange={setDate} />
          </div>

          {/* Time */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-1.5">Time</label>
            <TimePicker value={time} onChange={setTime} />
          </div>

          {error && <p className="text-[11px] text-[#FF3B30]">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#FF9500] py-3 text-[13px] font-semibold text-white hover:bg-[#E68900] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}

const FILTERS = ['All', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
type Filter = typeof FILTERS[number];

const FILTER_LABEL: Record<Filter, string> = {
  All: 'All', PENDING: 'Pending', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

export default function BookingsPage() {
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [business, setBusiness]   = useState<Business | null>(null);
  const [selected, setSelected]   = useState<Booking | null>(null);
  const [filter, setFilter]       = useState<Filter>('All');
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const bizRef = useRef<Business | null>(null);

  const loadBookings = useCallback(async () => {
    const biz = bizRef.current;
    if (!biz) return;
    try {
      const bs: ApiBooking[] = await fetch(`${API_BASE}/bookings?businessId=${biz.id}`).then(r => r.json());
      const mapped: Booking[] = bs.map(b => ({
        id:          b.id,
        clientPhone: b.client.phone,
        serviceName: b.service.name,
        scheduledAt: b.scheduledAt,
        status:      b.status,
        price:       Number(b.service.price),
      }));
      setBookings(mapped);
      setSelected(prev => mapped.find(b => b.id === prev?.id) ?? mapped[0] ?? null);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/businesses`)
      .then(r => r.json())
      .then(async (bs: Business[]) => {
        const biz = bs[0];
        if (!biz) return;
        bizRef.current = biz;
        setBusiness(biz);
        await loadBookings();
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [loadBookings]);

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
      {showNew && business && (
        <NewBookingModal
          business={business}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); loadBookings(); }}
        />
      )}

      {/* ── Center column ── */}
      <div className="flex w-[300px] shrink-0 flex-col border-r border-black/[0.06] bg-white overflow-hidden">

        {/* Header */}
        <div className="shrink-0 border-b border-black/[0.06] px-4 h-[52px] flex items-center justify-between">
          <div>
            <span className="text-[12.5px] font-semibold text-[#1C1C1E]">All Bookings</span>
            <span className="ml-2 text-[10px] text-[#AEAEB2]">{bookings.length} total</span>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1 rounded-lg bg-[#FF9500] px-2.5 py-1.5 text-[10.5px] font-semibold text-white hover:bg-[#E68900] transition-colors"
          >
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
