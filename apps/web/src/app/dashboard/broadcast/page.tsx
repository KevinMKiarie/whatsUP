'use client';

import { useState } from 'react';
import {
  Radio, Send, Clock, Calendar, Users, CheckCircle2,
  Plus, Trash2, ChevronDown, Repeat, MessageSquare, BarChart2,
} from 'lucide-react';

interface Broadcast {
  id:        string;
  name:      string;
  message:   string;
  audience:  string;
  count:     number;
  schedule:  string;
  status:    'scheduled' | 'sent' | 'draft';
  sentAt?:   string;
  opened?:   number;
}

const BROADCASTS: Broadcast[] = [
  {
    id: '1', name: 'July Promo 🎉', audience: 'All clients',
    message: 'Hey {name}! 🌟 Book any service this July and get 15% off. Use code JULY15. Reply YES to book!',
    count: 48, schedule: 'Mon, Wed, Fri · 10:00 AM', status: 'scheduled',
    opened: 0,
  },
  {
    id: '2', name: 'Weekend Reminder', audience: 'Confirmed this week',
    message: 'Hi {name}! Just a reminder you have an appointment tomorrow. Reply CONFIRM to confirm or CANCEL to reschedule.',
    count: 12, schedule: 'Fri · 5:00 PM', status: 'sent', sentAt: '2026-06-28',
    opened: 9,
  },
  {
    id: '3', name: 'Re-engagement', audience: 'Inactive 30+ days',
    message: 'We miss you, {name}! 💆 It\'s been a while. Come back for a relaxing session — book now and get 10% off.',
    count: 23, schedule: 'Once · Jul 10, 9:00 AM', status: 'draft',
    opened: 0,
  },
];

const STATUS_META = {
  scheduled: { label: 'Scheduled', color: '#007AFF', bg: 'rgba(0,122,255,0.08)' },
  sent:      { label: 'Sent',      color: '#34C759', bg: 'rgba(52,199,89,0.08)'  },
  draft:     { label: 'Draft',     color: '#AEAEB2', bg: 'rgba(0,0,0,0.05)'      },
};

const AUDIENCE_OPTIONS = [
  'All clients',
  'Confirmed this week',
  'Pending confirmation',
  'Completed last 30 days',
  'Inactive 30+ days',
  'VIP (3+ bookings)',
];

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Tab = 'campaigns' | 'compose';

export default function BroadcastPage() {
  const [tab, setTab]           = useState<Tab>('campaigns');
  const [message, setMessage]   = useState('Hey {name}! 🌟 ');
  const [audience, setAudience] = useState('All clients');
  const [campaignName, setCampaignName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [time, setTime]         = useState('10:00');
  const [repeat, setRepeat]     = useState<'weekly' | 'once'>('weekly');
  const [oneOffDate, setOneOffDate] = useState('2026-07-10');
  const [sent, setSent]         = useState(false);

  const charCount  = message.length;
  const msgCount   = Math.ceil(charCount / 160);
  const clientCount = audience === 'All clients' ? 48
    : audience === 'Inactive 30+ days' ? 23
    : audience === 'VIP (3+ bookings)' ? 11
    : audience === 'Confirmed this week' ? 12
    : audience === 'Pending confirmation' ? 8
    : 15;

  function toggleDay(d: string) {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  }

  function handleSchedule() {
    setSent(true);
    setTimeout(() => { setSent(false); setTab('campaigns'); }, 1800);
  }

  const scheduleLabel = repeat === 'weekly'
    ? `${selectedDays.join(', ')} · ${time}`
    : `Once · ${new Date(oneOffDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} · ${time}`;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F5F4EF]">

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between border-b border-black/[0.06] bg-white px-6 h-[52px]">
        <div className="flex items-center gap-1 rounded-lg border border-black/[0.08] bg-[#FAFAF8] p-0.5">
          {([
            { id: 'campaigns', label: 'Campaigns' },
            { id: 'compose',   label: 'New Broadcast' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3.5 py-1 text-[11px] font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white shadow-sm text-[#1C1C1E] border border-black/[0.06]'
                  : 'text-[#AEAEB2] hover:text-[#6E6E73]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setTab('compose')}
          className="flex items-center gap-1.5 rounded-lg bg-[#FF9500] px-3.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#E68900] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Broadcast
        </button>
      </div>

      {tab === 'campaigns' ? (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Summary row */}
          <div className="flex gap-3">
            {[
              { label: 'Scheduled', count: BROADCASTS.filter(b => b.status === 'scheduled').length, icon: Clock,        color: '#007AFF' },
              { label: 'Sent',      count: BROADCASTS.filter(b => b.status === 'sent').length,      icon: CheckCircle2, color: '#34C759' },
              { label: 'Draft',     count: BROADCASTS.filter(b => b.status === 'draft').length,     icon: MessageSquare,color: '#AEAEB2' },
              { label: 'Reach',     count: BROADCASTS.reduce((s, b) => s + b.count, 0),             icon: Users,        color: '#FF9500' },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} className="flex-1 rounded-xl border border-black/[0.06] bg-white px-4 py-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background: `${color}15` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[16px] font-bold tracking-[-0.02em] text-[#1C1C1E]">{count}</p>
                  <p className="text-[10px] text-[#AEAEB2]">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Campaign cards */}
          <div className="space-y-3">
            {BROADCASTS.map((b) => {
              const st = STATUS_META[b.status];
              return (
                <div key={b.id} className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
                  <div className="flex items-start justify-between px-5 py-4 border-b border-black/[0.04]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,149,0,0.08)] shrink-0">
                        <Radio className="h-4 w-4 text-[#FF9500]" strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-[#1C1C1E]">{b.name}</p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[9.5px] font-semibold"
                            style={{ color: st.color, background: st.bg }}
                          >
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-[10.5px] text-[#AEAEB2]">
                            <Users className="h-3 w-3" />
                            {b.audience} · {b.count} clients
                          </span>
                          <span className="flex items-center gap-1 text-[10.5px] text-[#AEAEB2]">
                            <Clock className="h-3 w-3" />
                            {b.schedule}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button className="flex items-center gap-1 rounded-lg border border-black/[0.08] px-2.5 py-1.5 text-[10.5px] font-medium text-[#6E6E73] hover:bg-[rgba(0,0,0,0.03)] transition-colors">
                        <BarChart2 className="h-3 w-3" />
                        Stats
                      </button>
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#FF3B30] hover:bg-[rgba(255,59,48,0.06)] transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Message preview */}
                  <div className="px-5 py-3 bg-[#FAFAF8]">
                    <p className="text-[11.5px] text-[#6E6E73] leading-relaxed line-clamp-2">{b.message}</p>
                    {b.status === 'sent' && b.opened !== undefined && (
                      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-black/[0.04]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#AEAEB2]">Delivered</span>
                          <span className="text-[10.5px] font-semibold text-[#1C1C1E]">{b.count}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#AEAEB2]">Replied</span>
                          <span className="text-[10.5px] font-semibold text-[#34C759]">{b.opened}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#AEAEB2]">Rate</span>
                          <span className="text-[10.5px] font-semibold text-[#1C1C1E]">
                            {b.count > 0 ? Math.round(((b.opened ?? 0) / b.count) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* ── Compose tab ── */
        <div className="flex-1 overflow-hidden flex">

          {/* Compose form */}
          <div className="flex-1 overflow-y-auto px-8 py-6 max-w-xl">
            <div className="space-y-5">

              {/* Campaign name */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-1.5">Campaign Name</label>
                <input
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="e.g. July Promo"
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] transition-all placeholder-[#AEAEB2]"
                />
              </div>

              {/* Audience */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-1.5">Audience</label>
                <div className="relative">
                  <select
                    value={audience}
                    onChange={e => setAudience(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] transition-all pr-8"
                  >
                    {AUDIENCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#AEAEB2]" />
                </div>
                <p className="mt-1 text-[10.5px] text-[#AEAEB2]">
                  <span className="font-semibold text-[#FF9500]">{clientCount}</span> clients match this filter
                </p>
              </div>

              {/* Message composer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2]">Message</label>
                  <span className="text-[10px] text-[#AEAEB2]">{charCount}/160 · {msgCount} SMS</span>
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Write your message… Use {name} to personalize."
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-[13px] text-[#1C1C1E] leading-relaxed outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] resize-none transition-all placeholder-[#AEAEB2]"
                />
                {/* Quick inserts */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {['{name}', '{service}', '{date}', '{time}', '{price}'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => setMessage(p => p + tag)}
                      className="rounded-full border border-black/[0.08] bg-white px-2 py-0.5 text-[10px] font-mono font-semibold text-[#6E6E73] hover:border-[#FF9500]/30 hover:text-[#FF9500] transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-1.5">Schedule</label>
                <div className="rounded-xl border border-black/[0.08] bg-white overflow-hidden">
                  {/* Repeat type */}
                  <div className="flex border-b border-black/[0.05]">
                    {([
                      { id: 'weekly', label: 'Recurring', icon: Repeat },
                      { id: 'once',   label: 'One-time',  icon: Calendar },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setRepeat(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                          repeat === id
                            ? 'bg-[rgba(255,149,0,0.06)] text-[#FF9500] border-b-2 border-[#FF9500]'
                            : 'text-[#AEAEB2] hover:text-[#6E6E73]'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="px-4 py-4 space-y-3">
                    {repeat === 'weekly' ? (
                      <div>
                        <p className="text-[10.5px] text-[#AEAEB2] mb-2">Days</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {DAY_OPTIONS.map(d => (
                            <button
                              key={d}
                              onClick={() => toggleDay(d)}
                              className={`rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition-colors ${
                                selectedDays.includes(d)
                                  ? 'bg-[#FF9500] text-white'
                                  : 'bg-[rgba(0,0,0,0.04)] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.07)]'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10.5px] text-[#AEAEB2] mb-1.5">Date</p>
                        <input
                          type="date"
                          value={oneOffDate}
                          onChange={e => setOneOffDate(e.target.value)}
                          className="w-full rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-3 py-2 text-[12px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 transition-all"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-[10.5px] text-[#AEAEB2] mb-1.5">Time</p>
                      <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-3 py-2 text-[12px] font-mono text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleSchedule}
                disabled={!message.trim() || !campaignName.trim()}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all ${
                  sent
                    ? 'bg-[rgba(52,199,89,0.1)] text-[#34C759] border border-[rgba(52,199,89,0.2)]'
                    : 'bg-[#FF9500] text-white hover:bg-[#E68900] disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {sent ? (
                  <><CheckCircle2 className="h-4 w-4" /> Scheduled!</>
                ) : (
                  <><Send className="h-4 w-4" /> Schedule Broadcast</>
                )}
              </button>

            </div>
          </div>

          {/* WhatsApp preview */}
          <div className="w-[280px] shrink-0 border-l border-black/[0.06] bg-white overflow-y-auto">
            <div className="border-b border-black/[0.05] px-4 py-3.5">
              <p className="text-[12px] font-semibold text-[#1C1C1E]">Preview</p>
              <p className="text-[10.5px] text-[#AEAEB2]">How it looks in WhatsApp</p>
            </div>
            {/* Phone mockup */}
            <div className="px-4 py-5">
              <div className="rounded-2xl border border-black/[0.08] overflow-hidden bg-[#ECE5DD]">
                {/* WA header bar */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#075E54]">
                  <div className="h-6 w-6 rounded-full bg-[#25D366] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">GS</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white leading-none">Glow Studio</p>
                    <p className="text-[8px] text-[#B5CAC3]">Business Account</p>
                  </div>
                </div>
                {/* Messages */}
                <div className="p-3 space-y-2 min-h-[180px]">
                  <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm max-w-[85%]">
                    <p className="text-[11px] text-[#1C1C1E] leading-relaxed whitespace-pre-wrap">
                      {message
                        .replace('{name}', 'Jane')
                        .replace('{service}', 'Haircut & Blow-dry')
                        .replace('{date}', 'Jul 3')
                        .replace('{time}', '09:00')
                        .replace('{price}', 'KES 1,500')
                      }
                    </p>
                    <p className="text-[8px] text-[#AEAEB2] text-right mt-1">{time} ✓✓</p>
                  </div>
                </div>
                {/* Schedule info */}
                <div className="border-t border-black/[0.06] bg-white px-3 py-2">
                  <p className="text-[9px] text-[#AEAEB2] text-center">
                    Sending to {clientCount} clients · {scheduleLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
