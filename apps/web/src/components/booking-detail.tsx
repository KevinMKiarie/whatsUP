import {
  Calendar, Clock, Phone, DollarSign,
  Copy, CheckCircle2, Circle, ChevronRight,
  Scissors, FileText, XCircle,
} from 'lucide-react';
import type { Booking } from './booking-card';

const STEPS = ['PENDING', 'CONFIRMED', 'COMPLETED'];

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:   { color: '#FF9500', bg: 'rgba(255,149,0,0.08)',  label: 'Pending'   },
  CONFIRMED: { color: '#007AFF', bg: 'rgba(0,122,255,0.08)', label: 'Confirmed' },
  COMPLETED: { color: '#34C759', bg: 'rgba(52,199,89,0.08)', label: 'Completed' },
  CANCELLED: { color: '#FF3B30', bg: 'rgba(255,59,48,0.08)', label: 'Cancelled' },
};

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-black/[0.05] last:border-0">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(0,0,0,0.04)] shrink-0">
        <Icon className="h-3.5 w-3.5 text-[#6E6E73]" strokeWidth={1.75} />
      </div>
      <span className="text-[12px] text-[#AEAEB2] w-20 shrink-0">{label}</span>
      <span className="text-[12.5px] font-medium text-[#1C1C1E]">{value}</span>
    </div>
  );
}

const fakeConversation = [
  { role: 'client', text: 'Hi, I want to book a haircut' },
  { role: 'bot',    text: 'Hi! I\'d love to help you book at Glow Studio. We have Haircut & Blow-dry (60 min, KES 1,500). Which date works for you?' },
  { role: 'client', text: 'Tomorrow at 9am please' },
  { role: 'bot',    text: ' Booked! Haircut & Blow-dry on Jul 3 at 09:00. See you then!' },
];

export function BookingDetail({ booking }: { booking: Booking }) {
  const st   = STATUS_META[booking.status] ?? STATUS_META.PENDING;
  const dt   = new Date(booking.scheduledAt);
  const stepIdx = STEPS.indexOf(booking.status);
  const cancelled = booking.status === 'CANCELLED';

  const tasks = [
    { done: true,  label: 'Client contacted via WhatsApp' },
    { done: stepIdx >= 1 || cancelled, label: 'Appointment confirmed' },
    { done: stepIdx >= 2, label: 'Service delivered' },
    { done: false, label: 'Invoice sent to client' },
  ];

  return (
    <div className="flex h-full flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.06] px-6 h-[52px] shrink-0">
        <div className="flex items-center gap-1.5 text-[12px] text-[#AEAEB2]">
          <span>Bookings</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#1C1C1E]">{booking.serviceName}</span>
        </div>
        <div className="flex items-center gap-2">
          {!cancelled && booking.status !== 'COMPLETED' && (
            <>
              <button className="rounded-lg border border-[#FF3B30]/30 px-3 py-1.5 text-[11.5px] font-medium text-[#FF3B30] hover:bg-[rgba(255,59,48,0.05)] transition-colors">
                Cancel
              </button>
              {booking.status === 'PENDING' && (
                <button className="rounded-lg bg-[#FF9500] px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#E68900] transition-colors">
                  Confirm
                </button>
              )}
            </>
          )}
          {booking.status === 'COMPLETED' && (
            <button className="flex items-center gap-1.5 rounded-lg bg-[rgba(52,199,89,0.08)] border border-[rgba(52,199,89,0.2)] px-3 py-1.5 text-[11.5px] font-medium text-[#34C759] hover:bg-[rgba(52,199,89,0.12)] transition-colors">
              <FileText className="h-3.5 w-3.5" />
              Invoice
            </button>
          )}
        </div>
      </div>

      {/* Body - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 max-w-2xl">

          {/* Title */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(255,149,0,0.1)]">
                  <Scissors className="h-4 w-4 text-[#FF9500]" strokeWidth={2} />
                </div>
                <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1C1C1E]">
                  {booking.serviceName}
                </h1>
              </div>
              <p className="text-[12px] text-[#AEAEB2] font-mono ml-10">+{booking.clientPhone}</p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ color: st.color, background: st.bg }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
              {st.label}
            </span>
          </div>

          {/* Metadata box */}
          <section className="rounded-xl border border-black/[0.06] bg-[#FAFAF8] px-4 py-1 mb-4">
            <MetaRow icon={Calendar}     label="Date"    value={dt.toLocaleDateString('en-KE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} />
            <MetaRow icon={Clock}        label="Time"    value={dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} />
            <MetaRow icon={Phone}        label="Client"  value={`+${booking.clientPhone}`} />
            <MetaRow icon={DollarSign}   label="Amount"  value={`KES ${booking.price.toLocaleString()}`} />
          </section>

          {/* Status progress — segmented blocks */}
          <section className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-2">
              Progress
            </p>
            {cancelled ? (
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(255,59,48,0.15)] bg-[rgba(255,59,48,0.05)] px-4 py-3">
                <XCircle className="h-4 w-4 text-[#FF3B30]" />
                <span className="text-[12px] font-medium text-[#FF3B30]">Booking cancelled</span>
              </div>
            ) : (
              <div className="flex gap-1">
                {STEPS.map((step, i) => {
                  const done    = i <= stepIdx;
                  const current = i === stepIdx;
                  return (
                    <div key={step} className="flex-1">
                      <div
                        className="h-[5px] rounded-full transition-all duration-300"
                        style={{
                          background: done
                            ? current ? '#FF9500' : '#34C759'
                            : 'rgba(0,0,0,0.08)',
                        }}
                      />
                      <p className="mt-1 text-[9.5px] font-medium text-[#AEAEB2] capitalize">
                        {step.toLowerCase()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* AI Conversation snippet */}
          <section className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2]">
                WhatsApp Conversation
              </p>
              <button className="flex items-center gap-1 text-[10px] text-[#AEAEB2] hover:text-[#6E6E73] transition-colors">
                <Copy className="h-3 w-3" />
                Copy
              </button>
            </div>
            <div className="rounded-xl border border-black/[0.06] bg-[#FAFAF8] overflow-hidden">
              {fakeConversation.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 px-4 py-2.5 ${i > 0 ? 'border-t border-black/[0.04]' : ''}`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold text-white ${msg.role === 'bot' ? 'bg-[#FF9500]' : 'bg-[#AEAEB2]'}`}>
                    {msg.role === 'bot' ? 'AI' : 'C'}
                  </div>
                  <p className="text-[11.5px] text-[#1C1C1E] leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Checklist */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#AEAEB2] mb-2">
              Checklist
            </p>
            <div className="rounded-xl border border-black/[0.06] overflow-hidden">
              {tasks.map((task, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2.5 bg-white ${i > 0 ? 'border-t border-black/[0.04]' : ''}`}
                >
                  {task.done
                    ? <CheckCircle2 className="h-4 w-4 text-[#34C759] shrink-0" fill="rgba(52,199,89,0.12)" />
                    : <Circle className="h-4 w-4 text-[#C7C7CC] shrink-0" />
                  }
                  <span className={`text-[12px] ${task.done ? 'line-through text-[#AEAEB2]' : 'text-[#1C1C1E]'}`}>
                    {task.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export function BookingDetailEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-white gap-3">
      <div className="h-12 w-12 rounded-2xl border-2 border-dashed border-black/10 flex items-center justify-center">
        <Scissors className="h-5 w-5 text-[#AEAEB2]" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-[13px] font-medium text-[#1C1C1E]">No booking selected</p>
        <p className="text-[11.5px] text-[#AEAEB2]">Choose a booking from the list</p>
      </div>
    </div>
  );
}
