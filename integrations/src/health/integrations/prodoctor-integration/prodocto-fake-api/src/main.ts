import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  await app.listen(7575);
  console.log('ProDoctor Fake API rodando em http://localhost:7575');
}

bootstrap();
