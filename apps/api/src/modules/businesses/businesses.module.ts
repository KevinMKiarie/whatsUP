import { Module } from '@nestjs/common';
import { BusinessesController } from './businesses.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  controllers: [BusinessesController],
})
export class BusinessesModule {}
