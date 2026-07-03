import { StatusBadge } from './status-badge';

export interface Booking {
  id:          string;
  clientPhone: string;
  serviceName: string;
  scheduledAt: string;
  status:      string;
  price:       number;
}

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Client</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Service</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Date & Time</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Amount</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => {
            const dt = new Date(b.scheduledAt);
            return (
              <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/40'}>
                <td className="px-4 py-3 font-mono text-xs text-zinc-600">+{b.clientPhone}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{b.serviceName}</td>
                <td className="px-4 py-3 text-zinc-600">
                  <span>{dt.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                  <span className="ml-2 text-zinc-400">{dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="px-4 py-3 text-zinc-700">KES {b.price.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
              </tr>
            );
          })}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-zinc-400">No bookings found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
