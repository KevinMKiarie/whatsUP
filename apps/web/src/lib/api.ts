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

export type AudienceKey = 'all' | 'pending' | 'confirmed' | 'completed_30d' | 'inactive_30d' | 'vip';

export interface Broadcast {
  id: string;
  name: string;
  message: string;
  audienceKey: AudienceKey;
  repeatType: 'ONCE' | 'WEEKLY';
  scheduleDays: string[];
  scheduleTime: string;
  oneOffDate: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED';
  sentCount: number;
  nextFireAt: string | null;
  createdAt: string;
  _count?: { logs: number };
}

export interface Client {
  id: string;
  name: string | null;
  phone: string;
}

export function fetchClients(businessId: string, q?: string) {
  const qs = q ? `&q=${encodeURIComponent(q)}` : '';
  return apiFetch<Client[]>(`/businesses/clients?businessId=${businessId}${qs}`);
}

export function fetchBroadcasts(businessId: string) {
  return apiFetch<Broadcast[]>(`/broadcasts?businessId=${businessId}`);
}

export async function createBroadcast(businessId: string, dto: {
  name: string; message: string; audienceKey: AudienceKey;
  repeatType: 'ONCE' | 'WEEKLY'; scheduleDays?: string[];
  scheduleTime?: string; oneOffDate?: string; customPhones?: string[];
}): Promise<Broadcast> {
  const res = await fetch(`${API_BASE}/broadcasts?businessId=${businessId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function scheduleBroadcast(id: string): Promise<Broadcast> {
  const res = await fetch(`${API_BASE}/broadcasts/${id}/schedule`, { method: 'POST' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function deleteBroadcast(id: string): Promise<void> {
  await fetch(`${API_BASE}/broadcasts/${id}`, { method: 'DELETE' });
}
