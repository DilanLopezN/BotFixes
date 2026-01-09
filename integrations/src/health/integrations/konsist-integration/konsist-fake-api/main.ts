import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 7576;
  await app.listen(port);
  console.log(`[Konsist Fake API] Rodando na porta ${port}`);
}
bootstrap();
