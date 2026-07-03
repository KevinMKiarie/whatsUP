'use client';

import { useState } from 'react';
import {
  FileText, Download, Send, Eye, Plus, Search,
  CheckCircle2, Clock, AlertCircle, Palette, Upload,
} from 'lucide-react';

interface Invoice {
  id:          string;
  client:      string;
  phone:       string;
  service:     string;
  amount:      number;
  date:        string;
  status:      'sent' | 'pending' | 'overdue';
  invoiceNo:   string;
}

const INVOICES: Invoice[] = [
  { id: '1', client: 'Jane Mwangi',   phone: '254712345678', service: 'Haircut & Blow-dry', amount: 1500, date: '2026-07-03', status: 'sent',    invoiceNo: 'INV-0024' },
  { id: '2', client: 'Aisha Kamau',   phone: '254798765432', service: 'Full Facial',         amount: 2500, date: '2026-07-03', status: 'pending',  invoiceNo: 'INV-0025' },
  { id: '3', client: 'Brenda Otieno', phone: '254711223344', service: 'Manicure',            amount: 800,  date: '2026-07-02', status: 'sent',    invoiceNo: 'INV-0023' },
  { id: '4', client: 'Grace Njeri',   phone: '254799887766', service: 'Pedicure',            amount: 1000, date: '2026-06-28', status: 'overdue',  invoiceNo: 'INV-0020' },
  { id: '5', client: 'Susan Wambui',  phone: '254712000001', service: 'Haircut & Blow-dry',  amount: 1500, date: '2026-07-03', status: 'pending',  invoiceNo: 'INV-0026' },
];

const STATUS_META = {
  sent:    { label: 'Sent',    color: '#34C759', bg: 'rgba(52,199,89,0.08)',   icon: CheckCircle2 },
  pending: { label: 'Pending', color: '#FF9500', bg: 'rgba(255,149,0,0.08)',   icon: Clock },
  overdue: { label: 'Overdue', color: '#FF3B30', bg: 'rgba(255,59,48,0.08)',   icon: AlertCircle },
};

/* ─── Template preview ──────────────────────────────────────── */

interface TemplateConfig {
  accentColor: string;
  fontStyle:   'modern' | 'classic' | 'minimal';
  showLogo:    boolean;
  logoText:    string;
  tagline:     string;
  footer:      string;
}

const COLOR_PRESETS = [
  { name: 'Orange',  hex: '#FF9500' },
  { name: 'Indigo',  hex: '#5856D6' },
  { name: 'Teal',    hex: '#5AC8FA' },
  { name: 'Rose',    hex: '#FF2D55' },
  { name: 'Slate',   hex: '#3A3A3C' },
];

function InvoicePreview({ cfg }: { cfg: TemplateConfig }) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white overflow-hidden shadow-sm">
      {/* PDF header */}
      <div className="px-8 py-6" style={{ borderBottom: `3px solid ${cfg.accentColor}` }}>
        <div className="flex items-start justify-between">
          <div>
            {cfg.showLogo && (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white text-[13px] font-bold mb-2"
                style={{ background: cfg.accentColor }}
              >
                {cfg.logoText.slice(0, 2).toUpperCase()}
              </div>
            )}
            <p className="text-[15px] font-bold text-[#1C1C1E]">{cfg.logoText || 'Glow Studio'}</p>
            {cfg.tagline && <p className="text-[10px] text-[#AEAEB2] mt-0.5">{cfg.tagline}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#AEAEB2] uppercase tracking-[0.06em]">Invoice</p>
            <p className="text-[16px] font-bold" style={{ color: cfg.accentColor }}>INV-0026</p>
            <p className="text-[10px] text-[#AEAEB2] mt-1">Jul 3, 2026</p>
          </div>
        </div>
      </div>
      {/* Bill to */}
      <div className="px-8 py-4 bg-[#FAFAF8]">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[#AEAEB2] mb-1">Bill To</p>
        <p className="text-[12px] font-semibold text-[#1C1C1E]">Susan Wambui</p>
        <p className="text-[10.5px] text-[#6E6E73] font-mono">+254712000001</p>
      </div>
      {/* Line items */}
      <div className="px-8 py-4">
        <div className="flex justify-between text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[#AEAEB2] mb-2 border-b border-black/[0.05] pb-1">
          <span>Description</span>
          <span>Amount</span>
        </div>
        <div className="flex justify-between py-2 border-b border-black/[0.04]">
          <div>
            <p className="text-[11.5px] font-medium text-[#1C1C1E]">Haircut & Blow-dry</p>
            <p className="text-[10px] text-[#AEAEB2]">60 min · Jul 3, 09:00</p>
          </div>
          <p className="text-[11.5px] font-semibold text-[#1C1C1E]">KES 1,500</p>
        </div>
        <div className="flex justify-between pt-3">
          <p className="text-[12px] font-bold text-[#1C1C1E]">Total</p>
          <p className="text-[14px] font-bold" style={{ color: cfg.accentColor }}>KES 1,500</p>
        </div>
      </div>
      {/* Footer */}
      {cfg.footer && (
        <div className="px-8 py-3 bg-[#FAFAF8] border-t border-black/[0.04]">
          <p className="text-[9.5px] text-[#AEAEB2] text-center">{cfg.footer}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function InvoicesPage() {
  const [tab, setTab]       = useState<'list' | 'customize'>('list');
  const [query, setQuery]   = useState('');
  const [cfg, setCfg]       = useState<TemplateConfig>({
    accentColor: '#FF9500',
    fontStyle:   'modern',
    showLogo:    true,
    logoText:    'Glow Studio',
    tagline:     'Premium Salon Services',
    footer:      'Thank you for your business! · +254700000000',
  });
  const [saved, setSaved]   = useState(false);

  const visible = query.trim()
    ? INVOICES.filter(i =>
        i.client.toLowerCase().includes(query.toLowerCase()) ||
        i.invoiceNo.toLowerCase().includes(query.toLowerCase())
      )
    : INVOICES;

  const totals = {
    sent:    INVOICES.filter(i => i.status === 'sent').reduce((s, i) => s + i.amount, 0),
    pending: INVOICES.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0),
    overdue: INVOICES.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
  };

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F5F4EF]">

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between border-b border-black/[0.06] bg-white px-6 h-[52px]">
        <div className="flex items-center gap-1 rounded-lg border border-black/[0.08] bg-[#FAFAF8] p-0.5">
          {(['list', 'customize'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3.5 py-1 text-[11px] font-semibold transition-all capitalize ${
                tab === t
                  ? 'bg-white shadow-sm text-[#1C1C1E] border border-black/[0.06]'
                  : 'text-[#AEAEB2] hover:text-[#6E6E73]'
              }`}
            >
              {t === 'list' ? 'Invoices' : 'Customize Template'}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-[#FF9500] px-3.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#E68900] transition-colors">
          <Plus className="h-3.5 w-3.5" />
          New Invoice
        </button>
      </div>

      {tab === 'list' ? (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Summary chips */}
          <div className="flex gap-3">
            {([
              { label: 'Sent',    amount: totals.sent,    color: '#34C759' },
              { label: 'Pending', amount: totals.pending, color: '#FF9500' },
              { label: 'Overdue', amount: totals.overdue, color: '#FF3B30' },
            ] as const).map(({ label, amount, color }) => (
              <div key={label} className="flex-1 rounded-xl border border-black/[0.06] bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-1" style={{ color }}>
                  {label}
                </p>
                <p className="text-[18px] font-bold tracking-[-0.03em] text-[#1C1C1E]">
                  KES {amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
              <p className="text-[12.5px] font-semibold text-[#1C1C1E]">All Invoices</p>
              <div className="flex items-center gap-2 rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-2.5 py-1.5">
                <Search className="h-3 w-3 text-[#AEAEB2]" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search invoices…"
                  className="bg-transparent text-[11.5px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none w-36"
                />
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.04] bg-[#FAFAF8]">
                  {['Invoice', 'Client', 'Service', 'Date', 'Amount', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-[9.5px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {visible.map((inv) => {
                  const st = STATUS_META[inv.status];
                  const Icon = st.icon;
                  return (
                    <tr key={inv.id} className="hover:bg-[rgba(0,0,0,0.015)] transition-colors">
                      <td className="px-5 py-3 text-[11.5px] font-mono font-medium text-[#6E6E73]">{inv.invoiceNo}</td>
                      <td className="px-5 py-3">
                        <p className="text-[11.5px] font-semibold text-[#1C1C1E]">{inv.client}</p>
                        <p className="text-[10px] text-[#AEAEB2] font-mono">+{inv.phone}</p>
                      </td>
                      <td className="px-5 py-3 text-[11.5px] text-[#6E6E73]">{inv.service}</td>
                      <td className="px-5 py-3 text-[11px] text-[#AEAEB2]">
                        {new Date(inv.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-[11.5px] font-semibold text-[#1C1C1E]">KES {inv.amount.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ color: st.color, background: st.bg }}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button title="Preview" className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[rgba(0,0,0,0.05)] transition-colors">
                            <Eye className="h-3 w-3 text-[#AEAEB2]" />
                          </button>
                          <button title="Download PDF" className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[rgba(0,0,0,0.05)] transition-colors">
                            <Download className="h-3 w-3 text-[#AEAEB2]" />
                          </button>
                          <button title="Send via WhatsApp" className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[rgba(0,0,0,0.05)] transition-colors">
                            <Send className="h-3 w-3 text-[#AEAEB2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        /* ── Customize tab ── */
        <div className="flex-1 overflow-hidden flex gap-0">

          {/* Controls panel */}
          <div className="w-[300px] shrink-0 border-r border-black/[0.06] bg-white overflow-y-auto">
            <div className="px-5 py-5 space-y-6">

              {/* Business branding */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-3">Business Branding</p>
                <div className="space-y-3">
                  {/* Logo upload */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#6E6E73] mb-1.5">Business Logo</label>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-[14px] font-bold shrink-0"
                        style={{ background: cfg.accentColor }}
                      >
                        {cfg.logoText.slice(0, 2).toUpperCase()}
                      </div>
                      <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/20 bg-[#FAFAF8] py-2.5 text-[11px] font-medium text-[#6E6E73] hover:bg-[rgba(0,0,0,0.03)] transition-colors">
                        <Upload className="h-3 w-3" />
                        Upload image
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6E6E73] mb-1.5">Business Name</label>
                    <input
                      value={cfg.logoText}
                      onChange={e => setCfg(p => ({ ...p, logoText: e.target.value }))}
                      className="w-full rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-3 py-2 text-[12px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6E6E73] mb-1.5">Tagline / Description</label>
                    <input
                      value={cfg.tagline}
                      onChange={e => setCfg(p => ({ ...p, tagline: e.target.value }))}
                      placeholder="e.g. Premium Salon Services"
                      className="w-full rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-3 py-2 text-[12px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] transition-all placeholder-[#AEAEB2]"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-black/[0.05]" />

              {/* Accent color */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-3">
                  <Palette className="h-3 w-3 inline mr-1" />
                  Accent Color
                </p>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setCfg(p => ({ ...p, accentColor: c.hex }))}
                      title={c.name}
                      className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        background: c.hex,
                        borderColor: cfg.accentColor === c.hex ? c.hex : 'transparent',
                        outline: cfg.accentColor === c.hex ? `2px solid ${c.hex}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                  {/* Custom color */}
                  <label className="relative h-7 w-7 rounded-full border border-dashed border-black/20 flex items-center justify-center cursor-pointer hover:bg-[rgba(0,0,0,0.04)] overflow-hidden">
                    <span className="text-[9px] text-[#AEAEB2]">+</span>
                    <input
                      type="color"
                      value={cfg.accentColor}
                      onChange={e => setCfg(p => ({ ...p, accentColor: e.target.value }))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t border-black/[0.05]" />

              {/* Footer text */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-3">Footer</p>
                <textarea
                  value={cfg.footer}
                  onChange={e => setCfg(p => ({ ...p, footer: e.target.value }))}
                  rows={2}
                  placeholder="Thank you for your business!"
                  className="w-full rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-3 py-2 text-[12px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 resize-none transition-all placeholder-[#AEAEB2]"
                />
              </div>

              {/* Show logo toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#1C1C1E]">Show logo block</span>
                <button
                  role="switch"
                  aria-checked={cfg.showLogo}
                  onClick={() => setCfg(p => ({ ...p, showLogo: !p.showLogo }))}
                  className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${cfg.showLogo ? 'bg-[#FF9500]' : 'bg-black/10'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${cfg.showLogo ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                className={`w-full rounded-lg py-2 text-[12px] font-semibold transition-all ${
                  saved
                    ? 'bg-[rgba(52,199,89,0.1)] text-[#34C759] border border-[rgba(52,199,89,0.2)]'
                    : 'bg-[#FF9500] text-white hover:bg-[#E68900]'
                }`}
              >
                {saved ? '✓ Template Saved' : 'Save Template'}
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div className="flex-1 overflow-y-auto bg-[#F5F4EF] px-10 py-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-4">Live Preview</p>
            <div className="max-w-md">
              <InvoicePreview cfg={cfg} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
