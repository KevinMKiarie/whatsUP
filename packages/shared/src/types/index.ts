
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
  price: string; // formatted decimal string, e.g. "1500.00"
}

export interface BusinessContext {
  id: string;
  name: string;
  category: string; // "salon" | "tattoo shop" | etc.
  services: ServiceSummary[];
  availableSlots: string[]; // ["09:00", "09:30", ...]
}


export interface IncomingMessage {
  from: string;          // client phone, e.g. "254712345678"
  text: string;
  messageId: string;
  timestamp: number;
  businessPhone: string; // which business phone received the message
}

export interface QuickReplyButton {
  id: string;
  title: string; // max 20 chars for WhatsApp
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
  date?: string;  // "YYYY-MM-DD"
  time?: string;  // "HH:MM"
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
