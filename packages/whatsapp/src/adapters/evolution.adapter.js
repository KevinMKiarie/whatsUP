"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
class EvolutionAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async sendText(to, text) {
        await this.request("/message/sendText", { number: to, text });
    }
    async sendDocument(to, url, filename) {
        await this.request("/message/sendMedia", {
            number: to,
            mediatype: "document",
            media: url,
            fileName: filename,
        });
    }
    async sendLocation(to, lat, lng, name) {
        await this.request("/message/sendLocation", {
            number: to,
            latitude: lat,
            longitude: lng,
            name,
        });
    }
    async sendButtons(to, text, buttons) {
        await this.request("/message/sendButtons", {
            number: to,
            title: text,
            buttons: buttons.map((b) => ({
                buttonId: b.id,
                buttonText: { displayText: b.title },
            })),
        });
    }
    parseWebhook(payload) {
        try {
            const body = payload;
            if (body.event !== "messages.upsert")
                return null;
            const msg = body?.data?.messages?.[0];
            if (!msg || msg?.key?.fromMe)
                return null;
            const text = msg.message?.conversation ??
                msg.message?.extendedTextMessage?.text ??
                "";
            if (!text)
                return null;
            return {
                from: msg.key.remoteJid.replace("@s.whatsapp.net", ""),
                text,
                messageId: msg.key.id,
                timestamp: msg.messageTimestamp,
                businessPhone: body.destination ?? body.instance ?? "",
            };
        }
        catch {
            return null;
        }
    }
    async request(path, data) {
        const url = `${this.config.baseUrl}/api/${this.config.instance}${path}`;
        await axios_1.default.post(url, data, { headers: { apikey: this.config.apiKey } });
    }
}
exports.EvolutionAdapter = EvolutionAdapter;
//# sourceMappingURL=evolution.adapter.js.map