import { cn } from '@/lib/utils';

export interface Booking {
  id:          string;
  clientPhone: string;
  serviceName: string;
  scheduledAt: string;
  status:      'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  price:       number;
}

const STATUS_STYLE: Record<string, { dot: string; label: string; text: string }> = {
  PENDING:   { dot: 'bg-[#FF9500]', label: 'bg-[rgba(255,149,0,0.1)] text-[#FF9500]',  text: 'Pending'   },
  CONFIRMED: { dot: 'bg-[#007AFF]', label: 'bg-[rgba(0,122,255,0.08)] text-[#007AFF]', text: 'Confirmed' },
  COMPLETED: { dot: 'bg-[#34C759]', label: 'bg-[rgba(52,199,89,0.08)] text-[#34C759]', text: 'Completed' },
  CANCELLED: { dot: 'bg-[#FF3B30]', label: 'bg-[rgba(255,59,48,0.08)] text-[#FF3B30]', text: 'Cancelled' },
};

function monogram(phone: string) {
  const digits = phone.replace(/\D/g, '').slice(-4);
  return digits.slice(0, 2);
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'just now';
}

interface Props {
  booking:  Booking;
  selected: boolean;
  onClick:  () => void;
}

export function BookingCard({ booking, selected, onClick }: Props) {
  const st = STATUS_STYLE[booking.status] ?? STATUS_STYLE.PENDING;
  const dt = new Date(booking.scheduledAt);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-3 py-3 border-b border-black/[0.05] transition-colors relative',
        selected
          ? 'bg-[rgba(255,149,0,0.05)]'
          : 'hover:bg-[rgba(0,0,0,0.02)]'
      )}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-[#FF9500]" />
      )}

      {/* Dashed monogram block */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-black/20 bg-white">
        <span className="text-[11px] font-mono font-semibold tracking-wider text-[#6E6E73]">
          {monogram(booking.clientPhone)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-[12.5px] font-semibold text-[#1C1C1E] leading-tight truncate">
            {booking.serviceName}
          </p>
          <span className="text-[10.5px] text-[#AEAEB2] whitespace-nowrap mt-px">
            {relativeTime(booking.scheduledAt)}
          </span>
        </div>

        <p className="mt-0.5 text-[11px] text-[#AEAEB2] font-mono">
          +{booking.clientPhone}
        </p>

        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', st.label)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
            {st.text}
          </span>
          <span className="text-[10px] text-[#AEAEB2]">·</span>
          <span className="text-[10px] font-medium text-[#6E6E73]">
            {dt.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} {dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </button>
  );
}
