export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ServiceSummary {
  id: string;
  name: string;
  durationMinutes: number;
  price: string;
}

export interface BusinessContext {
  id: string;
  name: string;
  category: string;
  services: ServiceSummary[];
  availableSlots: string[];
}

export interface IncomingMessage {
  from: string;
  text: string;
  messageId: string;
  timestamp: number;
  businessPhone: string;
}

export interface QuickReplyButton {
  id: string;
  title: string;
}

export enum ConversationState {
  IDLE = 'IDLE',
  AWAITING_SERVICE = 'AWAITING_SERVICE',
  AWAITING_DATE = 'AWAITING_DATE',
  AWAITING_TIME = 'AWAITING_TIME',
  CONFIRMING_BOOKING = 'CONFIRMING_BOOKING',
}

export interface BookingDraft {
  serviceId?: string;
  serviceName?: string;
  date?: string;
  time?: string;
}

export interface ConversationContext {
  state: ConversationState;
  draft: BookingDraft;
}

export type AIAction =
  | { type: 'reply'; text: string }
  | { type: 'update_draft'; draft: BookingDraft; replyText: string }
  | { type: 'confirm_booking' }
  | { type: 'cancel' };
