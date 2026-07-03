import type { IWhatsAppAdapter } from "../adapter.interface";
import type { IncomingMessage, QuickReplyButton } from "@whatsup/shared";
export interface EvolutionConfig {
    baseUrl: string;
    instance: string;
    apiKey: string;
}
export declare class EvolutionAdapter implements IWhatsAppAdapter {
    private readonly config;
    constructor(config: EvolutionConfig);
    sendText(to: string, text: string): Promise<void>;
    sendDocument(to: string, url: string, filename: string): Promise<void>;
    sendLocation(to: string, lat: number, lng: number, name: string): Promise<void>;
    sendButtons(to: string, text: string, buttons: QuickReplyButton[]): Promise<void>;
    parseWebhook(payload: unknown): IncomingMessage | null;
    private request;
}
