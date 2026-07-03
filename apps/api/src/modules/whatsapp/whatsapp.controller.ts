import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { IWhatsAppAdapter } from '@whatsup/whatsapp';
import { WHATSAPP_ADAPTER } from './whatsapp.tokens';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly baseUrl: string;
  private readonly instance: string;
  private readonly apiKey: string;

  constructor(
    private readonly whatsapp: WhatsappService,
    @Inject(WHATSAPP_ADAPTER) private readonly adapter: IWhatsAppAdapter,
    private readonly config: ConfigService,
  ) {
    this.baseUrl  = config.get<string>('evolution.baseUrl')!;
    this.instance = config.get<string>('evolution.instance')!;
    this.apiKey   = config.get<string>('evolution.apiKey')!;
  }

  // Evolution API / Meta POSTs incoming messages here
  @Post('webhook')
  async receive(@Body() body: unknown): Promise<{ status: string }> {
    const msg = this.adapter.parseWebhook(body);
    if (msg) await this.whatsapp.handleMessage(msg);
    return { status: 'ok' };
  }

  // Meta Cloud API webhook verification (GET with hub.challenge)
  @Get('webhook')
  verify(
    @Query('hub.mode')         mode:      string,
    @Query('hub.verify_token') token:     string,
    @Query('hub.challenge')    challenge: string,
  ): string | { error: string } {
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      return challenge;
    }
    return { error: 'Verification failed' };
  }

  // GET /whatsapp/status — connection state from Evolution API
  @Get('status')
  async status(): Promise<{ state: string; phoneNumber?: string }> {
    try {
      const res = await axios.get(
        `${this.baseUrl}/instance/connectionState/${this.instance}`,
        { headers: { apikey: this.apiKey } },
      );
      return {
        state: res.data?.instance?.state ?? res.data?.state ?? 'unknown',
        phoneNumber: res.data?.instance?.profileName ?? undefined,
      };
    } catch {
      return { state: 'unreachable' };
    }
  }

  // GET /whatsapp/qr — base64 QR code image from Evolution API
  @Get('qr')
  async qrCode(): Promise<{ qr?: string; state: string }> {
    try {
      const res = await axios.get(
        `${this.baseUrl}/instance/connect/${this.instance}`,
        { headers: { apikey: this.apiKey } },
      );
      return {
        state: 'connecting',
        qr: res.data?.base64 ?? res.data?.qrcode?.base64 ?? undefined,
      };
    } catch {
      return { state: 'error' };
    }
  }

  // POST /whatsapp/instance — create Evolution instance if it doesn't exist yet
  @Post('instance')
  async createInstance(
    @Body('webhookUrl') webhookUrl: string,
  ): Promise<{ created: boolean; message: string }> {
    try {
      await axios.post(
        `${this.baseUrl}/instance/create`,
        {
          instanceName: this.instance,
          qrcode:       true,
          integration:  'WHATSAPP-BAILEYS',
          ...(webhookUrl && {
            webhook: {
              enabled: true,
              url:     webhookUrl,
              events:  ['MESSAGES_UPSERT'],
            },
          }),
        },
        { headers: { apikey: this.apiKey } },
      );
      return { created: true, message: `Instance "${this.instance}" created` };
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      return { created: false, message: String(msg) };
    }
  }

  // POST /whatsapp/webhook/configure — point Evolution webhook at this API
  @Post('webhook/configure')
  async configureWebhook(
    @Body('webhookUrl') webhookUrl: string,
  ): Promise<{ ok: boolean }> {
    await axios.put(
      `${this.baseUrl}/webhook/set/${this.instance}`,
      {
        enabled: true,
        url:     webhookUrl,
        events:  ['MESSAGES_UPSERT'],
      },
      { headers: { apikey: this.apiKey } },
    );
    return { ok: true };
  }
}
