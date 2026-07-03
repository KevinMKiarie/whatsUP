import { Inject, Injectable, Logger } from '@nestjs/common';
import { BookingStatus } from '@whatsup/db';
import type { IWhatsAppAdapter } from '@whatsup/whatsapp';
import { BookingsRepository, CreateBookingInput } from './bookings.repository';
import { WHATSAPP_ADAPTER } from '../whatsapp/whatsapp.tokens';

type Range = 'week' | 'month' | 'quarter';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly repo: BookingsRepository,
    @Inject(WHATSAPP_ADAPTER) private readonly adapter: IWhatsAppAdapter,
  ) {}

  getBusinessByPhone(phone: string) {
    return this.repo.findBusinessByPhone(phone);
  }

  getBusinessWithServices(id: string) {
    return this.repo.findBusinessWithServices(id);
  }

  getAvailableSlots(businessId: string, date: string) {
    return this.repo.getAvailableSlots(businessId, date);
  }

  async create(input: CreateBookingInput) {
    const booking = await this.repo.create(input);
    const date = new Date(input.scheduledAt).toLocaleString('en-KE', {
      dateStyle: 'medium', timeStyle: 'short',
    });
    try {
      await this.adapter.sendText(
        input.clientPhone,
        `✅ Your booking has been confirmed!\n\n📅 ${date}\n\nReply CANCEL if you need to reschedule. See you soon! 💆`,
      );
    } catch (err) {
      this.logger.warn(`WhatsApp confirmation failed for ${input.clientPhone}: ${err}`);
    }
    return booking;
  }

  listByBusiness(businessId: string) {
    return this.repo.findByBusiness(businessId);
  }

  findById(id: string) {
    return this.repo.findById(id);
  }

  updateStatus(id: string, status: BookingStatus) {
    return this.repo.updateStatus(id, status);
  }

  getConversation(bookingId: string) {
    return this.repo.getConversation(bookingId);
  }

  getAnalytics(businessId: string, range: Range) {
    return this.repo.getAnalytics(businessId, range);
  }
}
