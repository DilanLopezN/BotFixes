import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Sentry from '@sentry/node';

import { collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics({
	gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // These are the default buckets.
});

if (fs.existsSync(__dirname + '/../.env')) {
  dotenv.config({path: __dirname + '/../.env'  });
}
if (fs.existsSync(__dirname + '/../../.env')) {
  dotenv.config({ path: __dirname + '/../../.env' });
}
if (fs.existsSync(__dirname + '/../../../.env')) {
  dotenv.config({ path: __dirname + '/../../../.env' });
}
dotenv.config();

async function bootstrap() {

  if (process.env.NODE_ENV == 'production') {
    Sentry.init({ dsn: 'https://5d0f7a32ea22b47c5ff47389639d740d@o55573.ingest.us.sentry.io/4507013112004608' });
  }
  
  const app = await NestFactory.create(AppModule);

  process.on('uncaughtException', function (err) {
    Sentry.captureEvent({
      message: 'uncaughtException',
      extra: {
        data: 'Caught exception',
        err,
      },
    });
  });

  await app.listen(3002);
}
bootstrap();

