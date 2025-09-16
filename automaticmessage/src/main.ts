import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as duration from 'dayjs/plugin/duration';
import 'dayjs/locale/pt-br';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';

dayjs.extend(duration);
dayjs.extend(utc);
dayjs.locale('pt-br');

if (fs.existsSync('../.env')) {
  dotenv.config({ path: '../.env' });
}
if (fs.existsSync('../../.env')) {
  dotenv.config({ path: '../../.env' });
}

dotenv.config();

async function bootstrap() {

  console.log('process.env.START_TYPE', process.env.START_TYPE);
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Kissbot Automatic Message API')
    .setDescription('API documentation for the Kissbot Automatic Message system')
    .setVersion('1.0')
    .build();
  if (process.env.NODE_ENV == 'production') {
    Sentry.init({ dsn: 'https://c380171f504b23b58c64c23fba181623@o55573.ingest.us.sentry.io/4509198696251392' });
  }

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(9095);
}
bootstrap();