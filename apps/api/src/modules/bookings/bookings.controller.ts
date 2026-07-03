import {
  Body, Controller, Get, Param, Patch, Post, Query,
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

  @Post()
  create(@Body() body: { businessId: string; clientPhone: string; serviceId: string; scheduledAt: string }) {
    return this.bookings.create({
      businessId:  body.businessId,
      clientPhone: body.clientPhone,
      serviceId:   body.serviceId,
      scheduledAt: new Date(body.scheduledAt),
    });
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
