import { Controller, Get } from '@nestjs/common';
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
}
