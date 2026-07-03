import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConversationState, IncomingMessage } from '@whatsup/shared';
import type { IWhatsAppAdapter } from '@whatsup/whatsapp';
import { AiService } from '../ai/ai.service';
import { ConversationService } from '../ai/conversation.service';
import { BookingsService } from '../bookings/bookings.service';
import { InvoicingService } from '../invoicing/invoicing.service';
import { RatingsService } from '../ratings/ratings.service';
import { WHATSAPP_ADAPTER } from './whatsapp.tokens';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @Inject(WHATSAPP_ADAPTER) private readonly adapter: IWhatsAppAdapter,
    private readonly bookings:     BookingsService,
    private readonly ai:           AiService,
    private readonly conversation: ConversationService,
    private readonly invoicing:    InvoicingService,
    private readonly ratings:      RatingsService,
  ) {}

  async handleMessage(msg: IncomingMessage): Promise<void> {
    const { from, text, businessPhone } = msg;

    const business = await this.bookings.getBusinessByPhone(businessPhone);
    if (!business) {
      this.logger.warn(`No business registered for phone: ${businessPhone}`);
      return;
    }

    const bizWithServices = await this.bookings.getBusinessWithServices(business.id);
    const today  = new Date().toISOString().split('T')[0];
    const slots  = await this.bookings.getAvailableSlots(business.id, today);

    const bizContext = {
      id:             business.id,
      name:           bizWithServices!.name,
      category:       bizWithServices!.category,
      services:       bizWithServices!.services.map((s) => ({
        id:              s.id,
        name:            s.name,
        durationMinutes: s.durationMinutes,
        price:           s.price.toString(),
      })),
      availableSlots: slots,
    };

    const ctx    = await this.conversation.getOrCreate(from, business.id);
    const rawAI  = await this.ai.chat(text, [], bizContext, ctx);
    const action = this.conversation.parseAction(rawAI);

    switch (action.type) {
      case 'reply':
        await this.adapter.sendText(from, action.text);
        break;

      case 'update_draft': {
        const newCtx = {
          state: ConversationState.CONFIRMING_BOOKING,
          draft: { ...ctx.draft, ...action.draft },
        };
        await this.conversation.update(from, business.id, newCtx);
        await this.adapter.sendText(from, action.replyText);
        break;
      }

      case 'confirm_booking': {
        const { serviceId, date, time } = ctx.draft;
        if (!serviceId || !date || !time) {
          await this.adapter.sendText(from, 'I still need a few details — which service would you like?');
          break;
        }
        await this.bookings.create({
          businessId:  business.id,
          clientPhone: from,
          serviceId,
          scheduledAt: new Date(`${date}T${time}:00`),
        });
        await this.conversation.reset(from, business.id);
        await this.adapter.sendText(
          from,
          `You're booked! ✅ ${ctx.draft.serviceName} on ${date} at ${time}. See you then!`,
        );
        break;
      }

      case 'cancel':
        await this.conversation.reset(from, business.id);
        await this.adapter.sendText(from, "No problem! Let me know if you need anything else. 😊");
        break;
    }
  }
}
