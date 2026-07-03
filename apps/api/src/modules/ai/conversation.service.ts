import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AIAction,
  BookingDraft,
  ConversationContext,
  ConversationState,
} from '@whatsup/shared';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(clientPhone: string, businessId: string): Promise<ConversationContext> {
    const client = await this.prisma.client.upsert({
      where:  { phone: clientPhone },
      create: { phone: clientPhone },
      update: {},
    });

    const conv = await this.prisma.conversation.upsert({
      where:  { clientId: client.id },
      create: { clientId: client.id, businessId, state: ConversationState.IDLE, draft: {} },
      update: {},
    });

    return {
      state: conv.state as ConversationState,
      draft: (conv.draft as BookingDraft) ?? {},
    };
  }

  async update(clientPhone: string, businessId: string, ctx: ConversationContext): Promise<void> {
    const client = await this.prisma.client.findUnique({ where: { phone: clientPhone } });
    if (!client) return;

    await this.prisma.conversation.update({
      where: { clientId: client.id },
      data:  { state: ctx.state, draft: ctx.draft as object },
    });
  }

  async reset(clientPhone: string, businessId: string): Promise<void> {
    await this.update(clientPhone, businessId, { state: ConversationState.IDLE, draft: {} });
  }

  // Strips the JSON action block the AI appends and returns a typed action
  parseAction(aiText: string): AIAction {
    const match = aiText.match(/\{[^{}]*"action"\s*:[^{}]*\}/);
    if (!match) return { type: 'reply', text: aiText.trim() };

    const replyText = aiText.replace(match[0], '').trim();

    try {
      const json = JSON.parse(match[0]) as Record<string, string>;

      switch (json.action) {
        case 'select_service':
          return {
            type:      'update_draft',
            draft:     { serviceId: json.serviceId, serviceName: json.serviceName },
            replyText: replyText || 'Got it! Which date works for you?',
          };
        case 'select_slot':
          return {
            type:      'update_draft',
            draft:     { date: json.date, time: json.time },
            replyText: replyText || 'Perfect! Shall I confirm your booking?',
          };
        case 'confirm_booking':
          return { type: 'confirm_booking' };
        case 'cancel':
          return { type: 'cancel' };
        default:
          return { type: 'reply', text: replyText || aiText.trim() };
      }
    } catch {
      return { type: 'reply', text: aiText.trim() };
    }
  }
}
