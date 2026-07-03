'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Radio, Send, Clock, Calendar, Users, CheckCircle2,
  Plus, Trash2, ChevronDown, Repeat, MessageSquare, BarChart2, Loader2, Pencil,
} from 'lucide-react';
import {
  fetchBusinesses, fetchBroadcasts, createBroadcast, scheduleBroadcast, deleteBroadcast,
  fetchClients, type Broadcast, type AudienceKey, type Client, API_BASE,
} from '@/lib/api';
import { Calendar as DateCalendar, TimePicker, from24h } from '@/components/date-time-picker';
import { Search, X, UserCheck } from 'lucide-react';

const STATUS_META = {
  SCHEDULED: { label: 'Scheduled', color: '#007AFF', bg: 'rgba(0,122,255,0.08)' },
  SENT:      { label: 'Sent',      color: '#34C759', bg: 'rgba(52,199,89,0.08)'  },
  SENDING:   { label: 'Sending',   color: '#FF9500', bg: 'rgba(255,149,0,0.08)'  },
  DRAFT:     { label: 'Draft',     color: '#AEAEB2', bg: 'rgba(0,0,0,0.05)'      },
  PAUSED:    { label: 'Paused',    color: '#AEAEB2', bg: 'rgba(0,0,0,0.05)'      },
};

const AUDIENCE_OPTIONS: { label: string; key: AudienceKey; count: number }[] = [
  { label: 'All clients',          key: 'all',          count: 48 },
  { label: 'Confirmed this week',  key: 'confirmed',    count: 12 },
  { label: 'Pending confirmation', key: 'pending',      count: 8  },
  { label: 'Completed last 30d',   key: 'completed_30d',count: 15 },
  { label: 'Inactive 30+ days',    key: 'inactive_30d', count: 23 },
  { label: 'VIP (3+ bookings)',    key: 'vip',          count: 11 },
  { label: 'Custom selection',     key: 'custom',       count: 0  },
];

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Tab = 'campaigns' | 'compose';

function scheduleLabel(b: Broadcast): string {
  const t = b.scheduleTime ?? '00:00';
  const { hour, minute, ampm } = from24h(t);
  const tLabel = `${hour}:${String(minute).padStart(2, '0')} ${ampm}`;
  if (b.repeatType === 'WEEKLY') {
    return `${(b.scheduleDays as string[]).join(', ')} · ${tLabel}`;
  }
  if (b.oneOffDate) {
    return `Once · ${new Date(b.oneOffDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} · ${tLabel}`;
  }
  return tLabel;
}

export default function BroadcastPage() {
  const [tab, setTab]             = useState<Tab>('campaigns');
  const [businessId, setBusinessId] = useState('');
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Compose state
  const [message, setMessage]     = useState('Hey {name}! 🌟 ');
  const [audienceKey, setAudienceKey] = useState<AudienceKey>('all');
  const [campaignName, setCampaignName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [time, setTime]           = useState('10:00');
  const [repeat, setRepeat]       = useState<'WEEKLY' | 'ONCE'>('WEEKLY');
  const [oneOffDate, setOneOffDate] = useState('2026-07-10');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Custom audience
  const [customPhones, setCustomPhones] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);

  const load = useCallback(async (bId: string) => {
    setLoading(true);
    try {
      const data = await fetchBroadcasts(bId);
      setBroadcasts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses().then(bs => {
      if (bs[0]) { setBusinessId(bs[0].id); load(bs[0].id); }
    });
  }, [load]);

  useEffect(() => {
    if (audienceKey !== 'custom' || !businessId) return;
    const t = setTimeout(async () => {
      setSearchingClients(true);
      try { setClientResults(await fetchClients(businessId, clientSearch)); }
      finally { setSearchingClients(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch, audienceKey, businessId]);

  function toggleClient(phone: string) {
    setCustomPhones(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]);
  }

  function toggleDay(d: string) {
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function handleEdit(b: Broadcast) {
    setEditingId(b.id);
    setCampaignName(b.name);
    setMessage(b.message);
    setAudienceKey(b.audienceKey);
    setRepeat(b.repeatType);
    setSelectedDays(b.scheduleDays as string[]);
    setTime(b.scheduleTime);
    if (b.oneOffDate) setOneOffDate(b.oneOffDate.slice(0, 10));
    setTab('compose');
  }

  function resetCompose() {
    setEditingId(null);
    setCampaignName('');
    setMessage('Hey {name}! 🌟 ');
    setAudienceKey('all');
    setRepeat('WEEKLY');
    setSelectedDays(['Mon', 'Wed', 'Fri']);
    setTime('10:00');
    setOneOffDate('2026-07-10');
    setCustomPhones([]);
    setClientSearch('');
    setClientResults([]);
  }

  async function handleSchedule() {
    if (!businessId || !message.trim() || !campaignName.trim()) return;
    setSubmitting(true);
    try {
      const dto = {
        name: campaignName, message, audienceKey,
        repeatType: repeat,
        scheduleDays: repeat === 'WEEKLY' ? selectedDays : undefined,
        scheduleTime: time,
        oneOffDate: repeat === 'ONCE' ? oneOffDate : undefined,
        customPhones: audienceKey === 'custom' ? customPhones : undefined,
      };

      let id = editingId;
      if (editingId) {
        await fetch(`${API_BASE}/broadcasts/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        });
      } else {
        const bc = await createBroadcast(businessId, dto);
        id = bc.id;
      }

      await scheduleBroadcast(id!);
      setSubmitted(true);
      await load(businessId);
      setTimeout(() => { setSubmitted(false); setTab('campaigns'); resetCompose(); }, 1500);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteBroadcast(id);
    setBroadcasts(prev => prev.filter(b => b.id !== id));
  }

  const selectedAudience = AUDIENCE_OPTIONS.find(o => o.key === audienceKey)!;
  const charCount = message.length;
  const { hour, minute, ampm } = from24h(time);
  const timeLabel = `${hour}:${String(minute).padStart(2, '0')} ${ampm}`;
  const previewSchedule = repeat === 'WEEKLY'
    ? `${selectedDays.join(', ')} · ${timeLabel}`
    : `Once · ${new Date(oneOffDate + 'T00:00:00').toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} · ${timeLabel}`;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F5F4EF]">

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between border-b border-black/[0.06] bg-white px-6 h-[52px]">
        <div className="flex items-center gap-1 rounded-lg border border-black/[0.08] bg-[#FAFAF8] p-0.5">
          {([{ id: 'campaigns', label: 'Campaigns' }, { id: 'compose', label: 'New Broadcast' }] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3.5 py-1 text-[11px] font-semibold transition-all ${tab === t.id ? 'bg-white shadow-sm text-[#1C1C1E] border border-black/[0.06]' : 'text-[#AEAEB2] hover:text-[#6E6E73]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { resetCompose(); setTab('compose'); }}
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
              { label: 'Scheduled', count: broadcasts.filter(b => b.status === 'SCHEDULED').length, icon: Clock,         color: '#007AFF' },
              { label: 'Sent',      count: broadcasts.filter(b => b.status === 'SENT').length,      icon: CheckCircle2,  color: '#34C759' },
              { label: 'Draft',     count: broadcasts.filter(b => b.status === 'DRAFT').length,     icon: MessageSquare, color: '#AEAEB2' },
              { label: 'Reach',     count: broadcasts.reduce((s, b) => s + (b.sentCount ?? 0), 0),  icon: Users,         color: '#FF9500' },
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
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[#AEAEB2]" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Radio className="h-8 w-8 text-[#AEAEB2]" strokeWidth={1.5} />
              <p className="text-[13px] font-medium text-[#6E6E73]">No broadcasts yet</p>
              <button onClick={() => setTab('compose')} className="text-[11.5px] font-semibold text-[#FF9500]">Create your first broadcast →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((b) => {
                const st = STATUS_META[b.status] ?? STATUS_META.DRAFT;
                const audience = AUDIENCE_OPTIONS.find(o => o.key === b.audienceKey);
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
                            <span className="rounded-full px-2 py-0.5 text-[9.5px] font-semibold" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-[10.5px] text-[#AEAEB2]">
                              <Users className="h-3 w-3" />{audience?.label ?? b.audienceKey}
                            </span>
                            <span className="flex items-center gap-1 text-[10.5px] text-[#AEAEB2]">
                              <Clock className="h-3 w-3" />{scheduleLabel(b)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button className="flex items-center gap-1 rounded-lg border border-black/[0.08] px-2.5 py-1.5 text-[10.5px] font-medium text-[#6E6E73] hover:bg-[rgba(0,0,0,0.03)] transition-colors">
                          <BarChart2 className="h-3 w-3" />Stats
                        </button>
                        <button
                          onClick={() => handleEdit(b)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#007AFF] hover:bg-[rgba(0,122,255,0.06)] transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#FF3B30] hover:bg-[rgba(255,59,48,0.06)] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="px-5 py-3 bg-[#FAFAF8]">
                      <p className="text-[11.5px] text-[#6E6E73] leading-relaxed line-clamp-2">{b.message}</p>
                      {b.status === 'SENT' && (
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-black/[0.04]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#AEAEB2]">Sent</span>
                            <span className="text-[10.5px] font-semibold text-[#1C1C1E]">{b.sentCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#AEAEB2]">Logs</span>
                            <span className="text-[10.5px] font-semibold text-[#1C1C1E]">{b._count?.logs ?? 0}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto px-8 py-6 max-w-xl">
            <div className="space-y-5">

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-1.5">Campaign Name</label>
                <input
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="e.g. July Promo"
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] transition-all placeholder-[#AEAEB2]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-1.5">Audience</label>
                <div className="relative">
                  <select
                    value={audienceKey}
                    onChange={e => setAudienceKey(e.target.value as AudienceKey)}
                    className="w-full appearance-none rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] transition-all pr-8"
                  >
                    {AUDIENCE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#AEAEB2]" />
                </div>
                {audienceKey !== 'custom' && (
                  <p className="mt-1 text-[10.5px] text-[#AEAEB2]">
                    <span className="font-semibold text-[#FF9500]">{selectedAudience.count}</span> clients match this filter
                  </p>
                )}
              </div>

              {/* Custom client picker */}
              {audienceKey === 'custom' && (
                <div className="rounded-xl border border-black/[0.08] bg-white overflow-hidden">
                  {/* Selected chips */}
                  {customPhones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-3 pt-3">
                      {clientResults.filter(c => customPhones.includes(c.phone)).map(c => (
                        <span key={c.phone} className="flex items-center gap-1 rounded-full bg-[rgba(255,149,0,0.1)] px-2 py-0.5 text-[10.5px] font-medium text-[#FF9500]">
                          <UserCheck className="h-2.5 w-2.5" />
                          {c.name ?? c.phone}
                          <button onClick={() => toggleClient(c.phone)}><X className="h-2.5 w-2.5" /></button>
                        </span>
                      ))}
                      {customPhones.filter(p => !clientResults.find(c => c.phone === p)).map(p => (
                        <span key={p} className="flex items-center gap-1 rounded-full bg-[rgba(255,149,0,0.1)] px-2 py-0.5 text-[10.5px] font-medium text-[#FF9500]">
                          {p}
                          <button onClick={() => toggleClient(p)}><X className="h-2.5 w-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Search */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.05]">
                    {searchingClients
                      ? <Loader2 className="h-3.5 w-3.5 text-[#AEAEB2] animate-spin shrink-0" />
                      : <Search className="h-3.5 w-3.5 text-[#AEAEB2] shrink-0" />}
                    <input
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      placeholder="Search by name or phone…"
                      className="flex-1 text-[12px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none bg-transparent"
                    />
                  </div>
                  {/* Results */}
                  <div className="max-h-40 overflow-y-auto">
                    {clientResults.length === 0 ? (
                      <p className="py-4 text-center text-[11px] text-[#AEAEB2]">
                        {clientSearch ? 'No clients found' : 'Start typing to search clients'}
                      </p>
                    ) : (
                      clientResults.map(c => {
                        const selected = customPhones.includes(c.phone);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleClient(c.phone)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${selected ? 'bg-[rgba(255,149,0,0.06)]' : 'hover:bg-black/[0.02]'}`}
                          >
                            <div>
                              <p className="text-[12px] font-medium text-[#1C1C1E]">{c.name ?? 'Unknown'}</p>
                              <p className="text-[10.5px] text-[#AEAEB2]">{c.phone}</p>
                            </div>
                            {selected && <UserCheck className="h-3.5 w-3.5 text-[#FF9500] shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="px-3 py-2 border-t border-black/[0.05]">
                    <p className="text-[10.5px] text-[#AEAEB2]">
                      <span className="font-semibold text-[#FF9500]">{customPhones.length}</span> client{customPhones.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2]">Message</label>
                  <span className="text-[10px] text-[#AEAEB2]">{charCount}/160</span>
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Write your message… Use {name} to personalize."
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-[13px] text-[#1C1C1E] leading-relaxed outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] resize-none transition-all placeholder-[#AEAEB2]"
                />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {['{name}', '{service}', '{date}', '{time}', '{price}'].map(tag => (
                    <button key={tag} onClick={() => setMessage(p => p + tag)} className="rounded-full border border-black/[0.08] bg-white px-2 py-0.5 text-[10px] font-mono font-semibold text-[#6E6E73] hover:border-[#FF9500]/30 hover:text-[#FF9500] transition-colors">{tag}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-1.5">Schedule</label>
                <div className="rounded-xl border border-black/[0.08] bg-white overflow-hidden">
                  <div className="flex border-b border-black/[0.05]">
                    {([{ id: 'WEEKLY', label: 'Recurring', icon: Repeat }, { id: 'ONCE', label: 'One-time', icon: Calendar }] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setRepeat(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${repeat === id ? 'bg-[rgba(255,149,0,0.06)] text-[#FF9500] border-b-2 border-[#FF9500]' : 'text-[#AEAEB2] hover:text-[#6E6E73]'}`}
                      >
                        <Icon className="h-3 w-3" />{label}
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-4 space-y-3">
                    {repeat === 'WEEKLY' ? (
                      <div>
                        <p className="text-[10.5px] text-[#AEAEB2] mb-2">Days</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {DAY_OPTIONS.map(d => (
                            <button key={d} onClick={() => toggleDay(d)} className={`rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition-colors ${selectedDays.includes(d) ? 'bg-[#FF9500] text-white' : 'bg-[rgba(0,0,0,0.04)] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.07)]'}`}>{d}</button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10.5px] text-[#AEAEB2] mb-2">Date</p>
                        <DateCalendar value={oneOffDate} onChange={setOneOffDate} />
                      </div>
                    )}
                    <div>
                      <p className="text-[10.5px] text-[#AEAEB2] mb-1.5">Time</p>
                      <TimePicker value={time} onChange={setTime} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSchedule}
                disabled={!message.trim() || !campaignName.trim() || submitting}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all ${submitted ? 'bg-[rgba(52,199,89,0.1)] text-[#34C759] border border-[rgba(52,199,89,0.2)]' : 'bg-[#FF9500] text-white hover:bg-[#E68900] disabled:opacity-40 disabled:cursor-not-allowed'}`}
              >
                {submitted ? <><CheckCircle2 className="h-4 w-4" /> {editingId ? 'Updated!' : 'Scheduled!'}</>
                  : submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {editingId ? 'Saving…' : 'Scheduling…'}</>
                  : <><Send className="h-4 w-4" /> {editingId ? 'Save Changes' : 'Schedule Broadcast'}</>}
              </button>

            </div>
          </div>

          {/* WhatsApp preview */}
          <div className="w-[280px] shrink-0 border-l border-black/[0.06] bg-white overflow-y-auto">
            <div className="border-b border-black/[0.05] px-4 py-3.5">
              <p className="text-[12px] font-semibold text-[#1C1C1E]">Preview</p>
              <p className="text-[10.5px] text-[#AEAEB2]">How it looks in WhatsApp</p>
            </div>
            <div className="px-4 py-5">
              <div className="rounded-2xl border border-black/[0.08] overflow-hidden bg-[#ECE5DD]">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#075E54]">
                  <div className="h-6 w-6 rounded-full bg-[#25D366] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">GS</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white leading-none">Glow Studio</p>
                    <p className="text-[8px] text-[#B5CAC3]">Business Account</p>
                  </div>
                </div>
                <div className="p-3 space-y-2 min-h-[180px]">
                  <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm max-w-[85%]">
                    <p className="text-[11px] text-[#1C1C1E] leading-relaxed whitespace-pre-wrap">
                      {message.replace('{name}', 'Jane').replace('{service}', 'Haircut & Blow-dry').replace('{date}', 'Jul 3').replace('{time}', '09:00').replace('{price}', 'KES 1,500')}
                    </p>
                    <p className="text-[8px] text-[#AEAEB2] text-right mt-1">{time} ✓✓</p>
                  </div>
                </div>
                <div className="border-t border-black/[0.06] bg-white px-3 py-2">
                  <p className="text-[9px] text-[#AEAEB2] text-center">
                    Sending to {audienceKey === 'custom' ? customPhones.length : selectedAudience.count} clients · {previewSchedule}
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
