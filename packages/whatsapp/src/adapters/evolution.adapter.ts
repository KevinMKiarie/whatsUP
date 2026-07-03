import axios from "axios";
import type { IWhatsAppAdapter } from "../adapter.interface";
import type { IncomingMessage, QuickReplyButton } from "@whatsup/shared";

export interface EvolutionConfig {
  baseUrl: string;
  instance: string;
  apiKey: string;
}

export class EvolutionAdapter implements IWhatsAppAdapter {
  constructor(private readonly config: EvolutionConfig) {}

  async sendText(to: string, text: string): Promise<void> {
    await this.request("/message/sendText", { number: to, text });
  }

  async sendDocument(to: string, url: string, filename: string): Promise<void> {
    await this.request("/message/sendMedia", {
      number: to,
      mediatype: "document",
      media: url,
      fileName: filename,
    });
  }

  async sendLocation(
    to: string,
    lat: number,
    lng: number,
    name: string,
  ): Promise<void> {
    await this.request("/message/sendLocation", {
      number: to,
      latitude: lat,
      longitude: lng,
      name,
    });
  }

  async sendButtons(
    to: string,
    text: string,
    buttons: QuickReplyButton[],
  ): Promise<void> {
    await this.request("/message/sendButtons", {
      number: to,
      title: text,
      buttons: buttons.map((b) => ({
        buttonId: b.id,
        buttonText: { displayText: b.title },
      })),
    });
  }

  parseWebhook(payload: unknown): IncomingMessage | null {
    try {
      const body = payload as Record<string, any>;

      // Evolution only fires this event for incoming messages
      if (body.event !== "messages.upsert") return null;

      const msg = body?.data?.messages?.[0];

      // Ignore messages sent by the business itself
      if (!msg || msg?.key?.fromMe) return null;

      const text =
        msg.message?.conversation ??
        msg.message?.extendedTextMessage?.text ??
        "";

      if (!text) return null;

      return {
        from: msg.key.remoteJid.replace("@s.whatsapp.net", ""),
        text,
        messageId: msg.key.id,
        timestamp: msg.messageTimestamp,
        businessPhone: body.destination ?? body.instance ?? "",
      };
    } catch {
      return null;
    }
  }

  private async request(
    path: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const url = `${this.config.baseUrl}/api/${this.config.instance}${path}`;
    await axios.post(url, data, { headers: { apikey: this.config.apiKey } });
  }
}
