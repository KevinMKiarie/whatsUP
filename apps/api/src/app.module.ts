import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import configuration from './config/configurations';
import { PrismaModule } from './prisma/prisma.module';
import { AdapterModule } from './modules/adapter/adapter.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AiModule } from './modules/ai/ai.module';
import { InvoicingModule } from './modules/invoicing/invoicing.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { BroadcastModule } from './modules/broadcast/broadcast.module';
import { BusinessesModule } from './modules/businesses/businesses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:    true,
      load:        [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath:   join(process.cwd(), 'uploads'),
      serveRoot:  '/uploads',
      serveStaticOptions: { index: false },
    }),
    PrismaModule,
    AdapterModule,
    BookingsModule,
    AiModule,
    InvoicingModule,
    RatingsModule,
    WhatsappModule,
    BroadcastModule,
    BusinessesModule,
  ],
})
export class AppModule {}
