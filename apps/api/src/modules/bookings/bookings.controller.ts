import {
  Body, Controller, Get, Param, Patch, Query,
} from '@nestjs/common';
import { BookingStatus } from '@whatsup/db';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list(@Query('businessId') businessId: string) {
    return this.bookings.listByBusiness(businessId);
  }

  @Get('analytics')
  analytics(
    @Query('businessId') businessId: string,
    @Query('range') range: 'week' | 'month' | 'quarter' = 'week',
  ) {
    return this.bookings.getAnalytics(businessId, range);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookings.updateStatus(id, status);
  }
}
