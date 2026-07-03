'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ── Helpers ───────────────────────────────────────────────────── */

export function to24h(hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour % 12;
  if (ampm === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function from24h(time: string): { hour: number; minute: number; ampm: 'AM' | 'PM' } {
  const [hStr, mStr] = time.split(':');
  const h24 = parseInt(hStr ?? '0', 10);
  const ampm: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM';
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour, minute: parseInt(mStr ?? '0', 10), ampm };
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/* ── Calendar ──────────────────────────────────────────────────── */

interface CalendarProps {
  value: string;        // "YYYY-MM-DD"
  onChange: (v: string) => void;
}

export function Calendar({ value, onChange }: CalendarProps) {
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [view, setView] = useState(() => {
    const d = selected ?? new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstDay  = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const today     = new Date();

  function prev() {
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  }
  function next() {
    setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  }
  function select(day: number) {
    const d = new Date(view.year, view.month, day);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5 text-[#6E6E73]" />
        </button>
        <span className="text-[12px] font-semibold text-[#1C1C1E]">
          {MONTHS[view.month]} {view.year}
        </span>
        <button onClick={next} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5 transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-[#6E6E73]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9.5px] font-semibold text-[#AEAEB2] py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isSelected = selected?.getDate() === day && selected?.getMonth() === view.month && selected?.getFullYear() === view.year;
          const isToday = today.getDate() === day && today.getMonth() === view.month && today.getFullYear() === view.year;
          return (
            <button
              key={i}
              onClick={() => select(day)}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11.5px] font-medium transition-colors ${
                isSelected
                  ? 'bg-[#FF9500] text-white font-semibold'
                  : isToday
                  ? 'border border-[#FF9500] text-[#FF9500]'
                  : 'text-[#1C1C1E] hover:bg-black/5'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Time Picker ───────────────────────────────────────────────── */

interface TimePickerProps {
  value: string;        // "HH:MM" 24h
  onChange: (v: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const parsed = from24h(value || '10:00');
  const [hour, setHour]   = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [ampm, setAmpm]   = useState<'AM' | 'PM'>(parsed.ampm);

  function emit(h: number, m: number, a: 'AM' | 'PM') {
    onChange(to24h(h, m, a));
  }

  return (
    <div className="flex items-center gap-2">
      {/* Hour */}
      <select
        value={hour}
        onChange={e => { const h = Number(e.target.value); setHour(h); emit(h, minute, ampm); }}
        className="rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-2 py-2 text-[12px] font-mono text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 transition-all"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
        ))}
      </select>

      <span className="text-[14px] font-semibold text-[#6E6E73]">:</span>

      {/* Minute */}
      <select
        value={minute}
        onChange={e => { const m = Number(e.target.value); setMinute(m); emit(hour, m, ampm); }}
        className="rounded-lg border border-black/[0.08] bg-[#FAFAF8] px-2 py-2 text-[12px] font-mono text-[#1C1C1E] outline-none focus:border-[#FF9500]/40 transition-all"
      >
        {MINUTES.map(m => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>

      {/* AM / PM */}
      <div className="flex rounded-lg border border-black/[0.08] overflow-hidden">
        {(['AM', 'PM'] as const).map(a => (
          <button
            key={a}
            onClick={() => { setAmpm(a); emit(hour, minute, a); }}
            className={`px-3 py-2 text-[11px] font-semibold transition-colors ${
              ampm === a ? 'bg-[#FF9500] text-white' : 'bg-[#FAFAF8] text-[#6E6E73] hover:bg-black/5'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
