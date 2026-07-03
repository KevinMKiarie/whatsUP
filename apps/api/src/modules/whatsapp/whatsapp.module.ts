import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { BookingsModule } from '../bookings/bookings.module';
import { InvoicingModule } from '../invoicing/invoicing.module';
import { RatingsModule } from '../ratings/ratings.module';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports:     [BookingsModule, AiModule, InvoicingModule, RatingsModule],
  controllers: [WhatsappController],
  providers:   [WhatsappService],
})
export class WhatsappModule {}
