import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvolutionAdapter } from '@whatsup/whatsapp';
import { WHATSAPP_ADAPTER } from '../whatsapp/whatsapp.tokens';

@Global()
@Module({
  providers: [
    {
      provide:    WHATSAPP_ADAPTER,
      useFactory: (cfg: ConfigService) =>
        new EvolutionAdapter({
          baseUrl:  cfg.get<string>('evolution.baseUrl')!,
          instance: cfg.get<string>('evolution.instance')!,
          apiKey:   cfg.get<string>('evolution.apiKey')!,
        }),
      inject: [ConfigService],
    },
  ],
  exports: [WHATSAPP_ADAPTER],
})
export class AdapterModule {}
