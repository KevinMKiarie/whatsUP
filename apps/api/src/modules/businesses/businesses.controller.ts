import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.business.findMany({
      include: { services: true },
      take: 10,
    });
  }

  @Get('clients')
  async clients(
    @Query('businessId') businessId: string,
    @Query('q') q?: string,
  ) {
    return this.prisma.client.findMany({
      where: {
        bookings: { some: { businessId } },
        ...(q ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        } : {}),
      },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
  }
}
