import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveRating(bookingId: string, score: number, comment?: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where:  { id: bookingId },
      select: { businessId: true, clientId: true },
    });

    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);

    await this.prisma.rating.upsert({
      where:  { bookingId },
      create: { bookingId, businessId: booking.businessId, clientId: booking.clientId, score, comment },
      update: { score, comment },
    });
  }

  async getAverageForBusiness(businessId: string): Promise<number> {
    const result = await this.prisma.rating.aggregate({
      where: { businessId },
      _avg:  { score: true },
    });
    return Number((result._avg.score ?? 0).toFixed(1));
  }
}
