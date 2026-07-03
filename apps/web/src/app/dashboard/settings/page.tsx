'use client';

import { useState } from 'react';
import { Save, Building2, Bot, Bell, Shield } from 'lucide-react';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-black/[0.05] px-5 py-3.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(255,149,0,0.1)] shrink-0">
          <Icon className="h-3.5 w-3.5 text-[#FF9500]" strokeWidth={1.75} />
        </div>
        <h2 className="text-[12.5px] font-semibold text-[#1C1C1E]">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-4">
        {children}
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-[#6E6E73] uppercase tracking-[0.04em]">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10.5px] text-[#AEAEB2]">{hint}</p>}
    </div>
  );
}

function Input({ mono, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-3 py-2 text-[12px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 focus:ring-2 focus:ring-[rgba(255,149,0,0.08)] transition-all placeholder-[#AEAEB2] ${mono ? 'font-mono' : ''}`}
    />
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[12px] font-medium text-[#1C1C1E]">{label}</p>
        <p className="text-[11px] text-[#AEAEB2] mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-[#FF9500]' : 'bg-black/10'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [notifyNew,       setNotifyNew]       = useState(true);
  const [notifyCancel,    setNotifyCancel]     = useState(true);
  const [autoConfirm,     setAutoConfirm]      = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F5F4EF]">

      {/* Page header */}
      <div className="flex items-center justify-between border-b border-black/[0.06] bg-white px-6 h-[52px] shrink-0">
        <div>
          <h1 className="text-[13px] font-semibold text-[#1C1C1E]">Settings</h1>
          <p className="text-[10.5px] text-[#AEAEB2]">Glow Studio · salon</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11.5px] font-semibold transition-all ${
            saved
              ? 'bg-[rgba(52,199,89,0.1)] text-[#34C759] border border-[rgba(52,199,89,0.2)]'
              : 'bg-[#FF9500] text-white hover:bg-[#E68900]'
          }`}
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="max-w-xl px-6 py-6 space-y-4">

        <Section title="Business Info" icon={Building2}>
          <Field label="Business Name">
            <Input defaultValue="Glow Studio" placeholder="Your business name" />
          </Field>
          <Field label="WhatsApp Number" hint="The number clients message to book">
            <Input defaultValue="+254700000000" placeholder="+254700000000" mono />
          </Field>
          <Field label="Category">
            <select className="w-full rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-3 py-2 text-[12px] text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 transition-all appearance-none">
              <option>salon</option>
              <option>tattoo</option>
              <option>barbershop</option>
              <option>spa</option>
              <option>clinic</option>
            </select>
          </Field>
        </Section>

        <Section title="AI Configuration" icon={Bot}>
          <Field label="Ollama Model" hint="Swap to Claude or OpenAI in production — change URL + add an API key">
            <Input defaultValue="qwen2.5:latest" placeholder="model name" mono />
          </Field>
          <Field label="Ollama URL">
            <Input defaultValue="http://localhost:11434/v1" placeholder="http://…" mono />
          </Field>
          <Field label="Max Response Tokens">
            <Input type="number" defaultValue="512" mono />
          </Field>
        </Section>

        <Section title="Notifications" icon={Bell}>
          <Toggle
            label="New Booking"
            description="Alert when a client books via WhatsApp"
            checked={notifyNew}
            onChange={setNotifyNew}
          />
          <div className="border-t border-black/[0.04]" />
          <Toggle
            label="Cancellation"
            description="Alert when a booking is cancelled"
            checked={notifyCancel}
            onChange={setNotifyCancel}
          />
          <div className="border-t border-black/[0.04]" />
          <Toggle
            label="Auto-confirm bookings"
            description="Skip manual review and confirm instantly"
            checked={autoConfirm}
            onChange={setAutoConfirm}
          />
        </Section>

        <Section title="Security" icon={Shield}>
          <Field label="Webhook Secret" hint="Evolution API webhook signing secret">
            <Input defaultValue="••••••••••••••••" type="password" mono />
          </Field>
          <Field label="API Base URL" hint="Your deployed API endpoint">
            <Input defaultValue="http://localhost:3001/api" placeholder="https://api.yourdomain.com" mono />
          </Field>
        </Section>

      </div>
    </div>
  );
}
