// Server-side (SSR/RSC): direct connection via API_URL
// Client-side (browser): /napi/* is proxied by Next.js rewrites → no CORS needed
export const API_BASE =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? 'http://localhost:3001/api')
    : '/napi';

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export interface Business {
  id: string;
  name: string;
  phone: string;
  services: Array<{ id: string; name: string; price: string }>;
}

export interface Booking {
  id: string;
  clientId: string;
  serviceId: string;
  scheduledAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  client: { phone: string };
  service: { name: string; price: string };
}

export interface Analytics {
  kpi: {
    revenue: number; revDelta: number;
    bookings: number; bookDelta: number;
    completion: number; compDelta: number;
    clients: number; clientDelta: number;
  };
  chart: Array<{ label: string; revenue: number; bookings: number }>;
  serviceBreakdown: Array<{ service: string; bookings: number; revenue: number; rate: number }>;
  statusDistribution: Record<string, number>;
}

export function fetchBusinesses() {
  return apiFetch<Business[]>('/businesses');
}

export function fetchBookings(businessId: string) {
  return apiFetch<Booking[]>(`/bookings?businessId=${businessId}`);
}

export function fetchAnalytics(businessId: string, range: string) {
  return apiFetch<Analytics>(`/bookings/analytics?businessId=${businessId}&range=${range}`);
}

export function fetchWhatsappStatus() {
  return apiFetch<{ state: string; phoneNumber?: string }>('/whatsapp/status');
}

export function fetchWhatsappQr() {
  return apiFetch<{ qr?: string; state: string }>('/whatsapp/qr');
}
