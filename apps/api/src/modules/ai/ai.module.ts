import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConversationService } from './conversation.service';

@Module({
  providers: [AiService, ConversationService],
  exports:   [AiService, ConversationService],
})
export class AiModule {}
