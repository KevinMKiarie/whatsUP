import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
// Load root monorepo .env before NestJS initialises any modules
// __dirname = apps/api/dist at runtime → ../../../ = monorepo root
config({ path: resolve(__dirname, '..', '..', '..', '.env') });
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api');
  app.enableCors();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`API running → http://localhost:${port}/api`);
}

bootstrap();

