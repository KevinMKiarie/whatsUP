import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@whatsup/db';
import { BookingsRepository, CreateBookingInput } from './bookings.repository';

type Range = 'week' | 'month' | 'quarter';

@Injectable()
export class BookingsService {
  constructor(private readonly repo: BookingsRepository) {}

  getBusinessByPhone(phone: string) {
    return this.repo.findBusinessByPhone(phone);
  }

  getBusinessWithServices(id: string) {
    return this.repo.findBusinessWithServices(id);
  }

  getAvailableSlots(businessId: string, date: string) {
    return this.repo.getAvailableSlots(businessId, date);
  }

  create(input: CreateBookingInput) {
    return this.repo.create(input);
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
