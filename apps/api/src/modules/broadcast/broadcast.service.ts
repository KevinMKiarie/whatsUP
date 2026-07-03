import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { IWhatsAppAdapter } from '@whatsup/whatsapp';
import { PrismaService } from '../../prisma/prisma.service';
import { WHATSAPP_ADAPTER } from '../whatsapp/whatsapp.tokens';
import { AudienceKey, CreateBroadcastDto, UpdateBroadcastDto } from './broadcast.dto';

const DAY_TO_DOW: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    private readonly prisma:  PrismaService,
    @Inject(WHATSAPP_ADAPTER) private readonly adapter: IWhatsAppAdapter,
  ) {}

  /* ── CRUD ──────────────────────────────────────────────────── */

  findAll(businessId: string) {
    return this.prisma.broadcast.findMany({
      where:   { businessId },
      include: { _count: { select: { logs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.broadcast.findUnique({
      where:   { id },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
  }

  async create(businessId: string, dto: CreateBroadcastDto) {
    return this.prisma.broadcast.create({
      data: {
        businessId,
        name:         dto.name,
        message:      dto.message,
        audienceKey:  dto.audienceKey,
        repeatType:   dto.repeatType,
        scheduleDays: dto.scheduleDays ?? [],
        scheduleTime: dto.scheduleTime ?? '10:00',
        oneOffDate:   dto.oneOffDate ? new Date(dto.oneOffDate) : null,
      },
    });
  }

  async update(id: string, dto: UpdateBroadcastDto) {
    return this.prisma.broadcast.update({
      where: { id },
      data:  {
        ...dto,
        oneOffDate: dto.oneOffDate ? new Date(dto.oneOffDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.broadcast.delete({ where: { id } });
  }

  /* ── Schedule / Pause ──────────────────────────────────────── */

  async schedule(id: string) {
    const bc = await this.prisma.broadcast.findUnique({ where: { id } });
    if (!bc) throw new NotFoundException(`Broadcast ${id} not found`);

    const nextFireAt = this.calcNextFireAt(
      bc.repeatType as string,
      bc.scheduleDays as string[],
      bc.scheduleTime,
      bc.oneOffDate,
    );

    return this.prisma.broadcast.update({
      where: { id },
      data:  { status: 'SCHEDULED', nextFireAt },
    });
  }

  async pause(id: string) {
    return this.prisma.broadcast.update({
      where: { id },
      data:  { status: 'PAUSED' },
    });
  }

  /* ── Immediate send ────────────────────────────────────────── */

  async sendNow(id: string, businessId: string): Promise<{ sent: number }> {
    const bc = await this.prisma.broadcast.findUnique({ where: { id } });
    if (!bc) throw new NotFoundException(`Broadcast ${id} not found`);

    const phones = await this.resolveAudience(businessId, bc.audienceKey as AudienceKey);
    return this.dispatch(bc, phones);
  }

  /* ── Cron: fire due broadcasts every minute ────────────────── */

  @Cron('* * * * *')
  async processScheduled() {
    const now = new Date();
    const due = await this.prisma.broadcast.findMany({
      where: {
        status:    'SCHEDULED',
        nextFireAt: { lte: now },
      },
    });

    for (const bc of due) {
      this.logger.log(`Firing broadcast ${bc.id} — ${bc.name}`);
      try {
        const phones = await this.resolveAudience(bc.businessId, bc.audienceKey as AudienceKey);
        await this.dispatch(bc, phones);

        if (bc.repeatType === 'WEEKLY') {
          const nextFireAt = this.calcNextFireAt('WEEKLY', bc.scheduleDays as string[], bc.scheduleTime, null);
          await this.prisma.broadcast.update({
            where: { id: bc.id },
            data:  { nextFireAt },
          });
        } else {
          await this.prisma.broadcast.update({
            where: { id: bc.id },
            data:  { status: 'SENT' },
          });
        }
      } catch (err) {
        this.logger.error(`Broadcast ${bc.id} failed: ${err}`);
      }
    }
  }

  /* ── Audience resolution ───────────────────────────────────── */

  private async resolveAudience(businessId: string, key: AudienceKey): Promise<string[]> {
    const now    = new Date();
    const ago30  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const week   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (key) {
      case 'all': {
        const rows = await this.prisma.booking.findMany({
          where:   { businessId },
          select:  { client: { select: { phone: true } } },
          distinct: ['clientId'],
        });
        return [...new Set(rows.map(r => r.client.phone))];
      }

      case 'pending': {
        const rows = await this.prisma.booking.findMany({
          where:  { businessId, status: 'PENDING', scheduledAt: { gte: now } },
          select: { client: { select: { phone: true } } },
          distinct: ['clientId'],
        });
        return rows.map(r => r.client.phone);
      }

      case 'confirmed': {
        const rows = await this.prisma.booking.findMany({
          where:  { businessId, status: 'CONFIRMED', scheduledAt: { gte: now } },
          select: { client: { select: { phone: true } } },
          distinct: ['clientId'],
        });
        return rows.map(r => r.client.phone);
      }

      case 'completed_30d': {
        const rows = await this.prisma.booking.findMany({
          where:  { businessId, status: 'COMPLETED', scheduledAt: { gte: ago30 } },
          select: { client: { select: { phone: true } } },
          distinct: ['clientId'],
        });
        return rows.map(r => r.client.phone);
      }

      case 'inactive_30d': {
        const active = await this.prisma.booking.findMany({
          where:  { businessId, scheduledAt: { gte: ago30 } },
          select: { clientId: true },
          distinct: ['clientId'],
        });
        const activeIds = active.map(r => r.clientId);
        const rows = await this.prisma.booking.findMany({
          where:  { businessId, clientId: { notIn: activeIds } },
          select: { client: { select: { phone: true } } },
          distinct: ['clientId'],
        });
        return rows.map(r => r.client.phone);
      }

      case 'vip': {
        const counts = await this.prisma.booking.groupBy({
          by:      ['clientId'],
          where:   { businessId, status: 'COMPLETED' },
          _count:  { clientId: true },
          having:  { clientId: { _count: { gte: 3 } } },
        });
        const ids = counts.map(c => c.clientId);
        const rows = await this.prisma.client.findMany({
          where:  { id: { in: ids } },
          select: { phone: true },
        });
        return rows.map(r => r.phone);
      }

      default:
        return [];
    }
  }

  /* ── Private dispatch ──────────────────────────────────────── */

  private async dispatch(bc: any, phones: string[]): Promise<{ sent: number }> {
    let sent = 0;

    await this.prisma.broadcast.update({
      where: { id: bc.id },
      data:  { status: 'SENDING' },
    });

    for (const phone of phones) {
      const client  = await this.prisma.client.findUnique({ where: { phone } });
      const name    = client?.name ?? phone;
      const message = bc.message
        .replace(/\{name\}/g, name)
        .replace(/\{service\}/g, 'your service')
        .replace(/\{date\}/g, new Date().toLocaleDateString('en-KE'))
        .replace(/\{time\}/g, bc.scheduleTime)
        .replace(/\{price\}/g, '');

      try {
        await this.adapter.sendText(phone, message);

        await this.prisma.broadcastLog.create({
          data: { broadcastId: bc.id, clientPhone: phone, message, status: 'sent', sentAt: new Date() },
        });
        sent++;
      } catch {
        await this.prisma.broadcastLog.create({
          data: { broadcastId: bc.id, clientPhone: phone, message, status: 'failed' },
        });
      }
    }

    await this.prisma.broadcast.update({
      where: { id: bc.id },
      data:  { sentCount: { increment: sent } },
    });

    return { sent };
  }

  /* ── Schedule helpers ──────────────────────────────────────── */

  private calcNextFireAt(
    repeatType: string,
    scheduleDays: string[],
    scheduleTime: string,
    oneOffDate: Date | null,
  ): Date {
    const [hh, mm] = scheduleTime.split(':').map(Number);
    const now      = new Date();

    if (repeatType === 'ONCE' && oneOffDate) {
      const d = new Date(oneOffDate);
      d.setHours(hh, mm, 0, 0);
      return d;
    }

    /* Next matching weekday */
    const targetDows = (scheduleDays as string[]).map(d => DAY_TO_DOW[d.toUpperCase()] ?? -1);

    for (let i = 1; i <= 7; i++) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + i);
      candidate.setHours(hh, mm, 0, 0);
      if (targetDows.includes(candidate.getDay())) return candidate;
    }

    /* Fallback: tomorrow */
    const fallback = new Date(now);
    fallback.setDate(now.getDate() + 1);
    fallback.setHours(hh, mm, 0, 0);
    return fallback;
  }
}
