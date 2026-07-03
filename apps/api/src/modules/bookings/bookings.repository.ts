import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@whatsup/db';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateBookingInput {
  businessId: string;
  clientPhone: string;
  serviceId: string;
  scheduledAt: Date;
}

type Range = 'week' | 'month' | 'quarter';

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBusinessByPhone(phone: string) {
    return this.prisma.business.findUnique({ where: { phone } });
  }

  findBusinessWithServices(id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      include: { services: true },
    });
  }

  async getAvailableSlots(businessId: string, date: string): Promise<string[]> {
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd   = new Date(`${date}T23:59:59`);

    const booked = await this.prisma.booking.findMany({
      where: {
        businessId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const bookedTimes = new Set(
      booked.map((b) => b.scheduledAt.toTimeString().slice(0, 5)),
    );

    const slots: string[] = [];
    for (let hour = 9; hour < 18; hour++) {
      for (const min of [0, 30]) {
        const slot = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        if (!bookedTimes.has(slot)) slots.push(slot);
      }
    }

    return slots;
  }

  async create(input: CreateBookingInput) {
    const client = await this.prisma.client.upsert({
      where:  { phone: input.clientPhone },
      create: { phone: input.clientPhone },
      update: {},
    });

    return this.prisma.booking.create({
      data: {
        businessId:  input.businessId,
        clientId:    client.id,
        serviceId:   input.serviceId,
        scheduledAt: input.scheduledAt,
      },
    });
  }

  findByBusiness(businessId: string, limit = 50) {
    return this.prisma.booking.findMany({
      where:   { businessId },
      include: { client: true, service: true, invoice: true },
      orderBy: { scheduledAt: 'desc' },
      take:    limit,
    });
  }

  findById(id: string) {
    return this.prisma.booking.findUnique({
      where:   { id },
      include: {
        client:   true,
        service:  true,
        business: true,
        invoice:  true,
      },
    });
  }

  updateStatus(id: string, status: BookingStatus) {
    return this.prisma.booking.update({
      where:   { id },
      data:    { status },
      include: { client: true, service: true, invoice: true },
    });
  }

  async getConversation(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where:  { id: bookingId },
      select: { clientId: true, businessId: true },
    });
    if (!booking) return null;

    return this.prisma.conversation.findFirst({
      where: { clientId: booking.clientId, businessId: booking.businessId },
    });
  }

  /* ── Analytics ───────────────────────────────────────────── */

  async getAnalytics(businessId: string, range: Range) {
    const now  = new Date();
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 90;

    const start     = new Date(now.getTime() - days * 86_400_000);
    const prevStart = new Date(start.getTime() - days * 86_400_000);

    const [current, previous] = await Promise.all([
      this.prisma.booking.findMany({
        where:   { businessId, scheduledAt: { gte: start } },
        include: { service: true },
      }),
      this.prisma.booking.findMany({
        where:   { businessId, scheduledAt: { gte: prevStart, lt: start } },
        include: { service: true },
      }),
    ]);

    const nc  = (bks: typeof current) => bks.filter(b => b.status !== 'CANCELLED');
    const cmp = (bks: typeof current) => bks.filter(b => b.status === 'COMPLETED');
    const rev = (bks: typeof current) =>
      cmp(bks).reduce((s, b) => s + Number(b.service.price), 0);
    const uClients = (bks: typeof current) => new Set(bks.map(b => b.clientId)).size;
    const rate     = (bks: typeof current) => {
      const n = nc(bks).length;
      return n === 0 ? 0 : Math.round((cmp(bks).length / n) * 100);
    };
    const pct = (curr: number, prev: number) =>
      prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 1000) / 10;

    const kpi = {
      revenue:     rev(current),
      revDelta:    pct(rev(current),       rev(previous)),
      bookings:    nc(current).length,
      bookDelta:   pct(nc(current).length, nc(previous).length),
      completion:  rate(current),
      compDelta:   pct(rate(current),      rate(previous)),
      clients:     uClients(current),
      clientDelta: pct(uClients(current),  uClients(previous)),
    };

    /* ── Chart buckets ── */
    const chart = this.buildChart(current, range, start, now);

    /* ── Service breakdown ── */
    const svcMap = new Map<string, { bookings: number; revenue: number; completed: number }>();
    for (const b of current) {
      const entry = svcMap.get(b.service.name) ?? { bookings: 0, revenue: 0, completed: 0 };
      entry.bookings++;
      if (b.status === 'COMPLETED') { entry.revenue += Number(b.service.price); entry.completed++; }
      svcMap.set(b.service.name, entry);
    }
    const serviceBreakdown = Array.from(svcMap.entries()).map(([service, e]) => ({
      service,
      bookings:  e.bookings,
      revenue:   e.revenue,
      rate:      e.bookings === 0 ? 0 : Math.round((e.completed / e.bookings) * 100),
    }));

    /* ── Status distribution ── */
    const statusDistribution = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 } as Record<string, number>;
    for (const b of current) statusDistribution[b.status] = (statusDistribution[b.status] ?? 0) + 1;

    return { kpi, chart, serviceBreakdown, statusDistribution };
  }

  private buildChart(
    bookings: Array<{ scheduledAt: Date; status: string; service: { price: any } }>,
    range: Range,
    start: Date,
    now:   Date,
  ) {
    if (range === 'week') {
      const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const map = new Map<string, { revenue: number; bookings: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        map.set(d.toDateString(), { revenue: 0, bookings: 0 });
      }
      for (const b of bookings) {
        const key = b.scheduledAt.toDateString();
        const bucket = map.get(key);
        if (bucket) {
          bucket.bookings++;
          if (b.status === 'COMPLETED') bucket.revenue += Number(b.service.price);
        }
      }
      return Array.from(map.entries()).map(([dateStr, v]) => ({
        label: DAY[new Date(dateStr).getDay()],
        ...v,
      }));
    }

    if (range === 'month') {
      const buckets: Array<{ label: string; revenue: number; bookings: number }> = [
        { label: 'Wk 1', revenue: 0, bookings: 0 },
        { label: 'Wk 2', revenue: 0, bookings: 0 },
        { label: 'Wk 3', revenue: 0, bookings: 0 },
        { label: 'Wk 4', revenue: 0, bookings: 0 },
      ];
      for (const b of bookings) {
        const idx = Math.min(3, Math.floor((b.scheduledAt.getTime() - start.getTime()) / (7 * 86_400_000)));
        const bucket = buckets[idx];
        if (bucket) {
          bucket.bookings++;
          if (b.status === 'COMPLETED') bucket.revenue += Number(b.service.price);
        }
      }
      return buckets;
    }

    /* quarter — group by month */
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const map = new Map<string, { revenue: number; bookings: number }>();
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now); d.setMonth(d.getMonth() - i);
      map.set(MONTHS[d.getMonth()], { revenue: 0, bookings: 0 });
    }
    for (const b of bookings) {
      const label = MONTHS[b.scheduledAt.getMonth()];
      const bucket = map.get(label);
      if (bucket) {
        bucket.bookings++;
        if (b.status === 'COMPLETED') bucket.revenue += Number(b.service.price);
      }
    }
    return Array.from(map.entries()).map(([label, v]) => ({ label, ...v }));
  }
}
