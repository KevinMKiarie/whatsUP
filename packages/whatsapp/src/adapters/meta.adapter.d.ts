import type { IWhatsAppAdapter } from "../adapter.interface";
import type { IncomingMessage, QuickReplyButton } from "@whatsup/shared";
export interface MetaConfig {
    accessToken: string;
    phoneNumberId: string;
    verifyToken: string;
}
export declare class MetaAdapter implements IWhatsAppAdapter {
    private readonly config;
    constructor(config: MetaConfig);
    sendText(_to: string, _text: string): Promise<void>;
    sendDocument(_to: string, _url: string, _filename: string): Promise<void>;
    sendLocation(_to: string, _lat: number, _lng: number, _name: string): Promise<void>;
    sendButtons(_to: string, _text: string, _buttons: QuickReplyButton[]): Promise<void>;
    parseWebhook(_payload: unknown): IncomingMessage | null;
}
