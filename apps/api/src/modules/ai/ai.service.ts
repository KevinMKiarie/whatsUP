import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { BusinessContext, ConversationContext } from '@whatsup/shared';
import { buildSystemPrompt } from './prompt.builder';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class AiService {
  private readonly llm: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.llm = new OpenAI({
      baseURL: this.config.get<string>('ollama.url'),
      apiKey:  'ollama', // Ollama ignores the key but OpenAI SDK requires it
    });
    this.model = this.config.get<string>('ollama.model')!;
  }

  async chat(
    userMessage: string,
    history: ChatMessage[],
    biz: BusinessContext,
    ctx: ConversationContext,
  ): Promise<string> {
    const response = await this.llm.chat.completions.create({
      model:    this.model,
      messages: [
        { role: 'system', content: buildSystemPrompt(biz, ctx) },
        ...history,
        { role: 'user', content: userMessage },
      ],
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
