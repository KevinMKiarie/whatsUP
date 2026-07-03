export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  ollama: {
    url: process.env.OLLAMA_URL ?? 'http://localhost:11434/v1',
    model: process.env.OLLAMA_MODEL ?? 'qwen2.5:14b',
  },
  evolution: {
    baseUrl: process.env.EVOLUTION_API_URL ?? '',
    instance: process.env.EVOLUTION_INSTANCE ?? '',
    apiKey: process.env.EVOLUTION_API_KEY ?? '',
  },
});
