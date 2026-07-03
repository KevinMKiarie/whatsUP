import type { IWhatsAppAdapter } from "../adapter.interface";
import type { IncomingMessage, QuickReplyButton } from "@whatsup/shared";

export interface MetaConfig {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
}

export class MetaAdapter implements IWhatsAppAdapter {
  constructor(private readonly config: MetaConfig) {}

  async sendText(_to: string, _text: string): Promise<void> {
    throw new Error(
      "MetaAdapter not implemented — use for production after Meta verification",
    );
  }

  async sendDocument(
    _to: string,
    _url: string,
    _filename: string,
  ): Promise<void> {
    throw new Error("MetaAdapter not implemented");
  }

  async sendLocation(
    _to: string,
    _lat: number,
    _lng: number,
    _name: string,
  ): Promise<void> {
    throw new Error("MetaAdapter not implemented");
  }

  async sendButtons(
    _to: string,
    _text: string,
    _buttons: QuickReplyButton[],
  ): Promise<void> {
    throw new Error("MetaAdapter not implemented");
  }

  parseWebhook(_payload: unknown): IncomingMessage | null {
    throw new Error("MetaAdapter not implemented");
  }
}
