import { cn } from '@/lib/utils';

const variants: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100   text-blue-800   border-blue-200',
  COMPLETED: 'bg-green-100  text-green-800  border-green-200',
  CANCELLED: 'bg-red-100    text-red-800    border-red-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', variants[status] ?? 'bg-zinc-100 text-zinc-800 border-zinc-200')}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
