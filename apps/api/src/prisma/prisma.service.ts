import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@whatsup/db';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly db = new PrismaClient();

  // Expose each model so repositories can do: this.prisma.booking.findMany()
  readonly business         = this.db.business;
  readonly service          = this.db.service;
  readonly client           = this.db.client;
  readonly booking          = this.db.booking;
  readonly invoice          = this.db.invoice;
  readonly rating           = this.db.rating;
  readonly conversation     = this.db.conversation;
  readonly invoiceTemplate  = this.db.invoiceTemplate;
  readonly broadcast        = this.db.broadcast;
  readonly broadcastLog     = this.db.broadcastLog;

  async onModuleInit() {
    await this.db.$connect();
  }

  async onModuleDestroy() {
    await this.db.$disconnect();
  }

  get $transaction() {
    return this.db.$transaction.bind(this.db);
  }
}
