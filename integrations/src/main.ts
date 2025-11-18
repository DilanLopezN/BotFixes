import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { urlencoded, json, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { nanoid } from 'nanoid';
import { collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics({
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

if (process.env.NODE_ENV == 'production') {
  new Sentry.init({
    tracesSampleRate: 0.7,
    dsn: 'https://c8ee1df6b13c406aa8e813032a504077@o55573.ingest.sentry.io/5774465',
  });
}

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  const config = app.select(AppModule).get(ConfigService);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    maxAge: 600,
    allowedHeaders: '*',
    preflightContinue: false,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());

  app.use(contextService.middleware('request'));
  app.use(function (req: Request, _, next: NextFunction) {
    contextService.set('req:default-headers', {
      conversationId: req.headers?.['x-conversation-id'] ?? '',
      workspaceId: req.headers?.['x-workspace-id'] ?? '',
      memberId: req.headers?.['x-member-id'] ?? '',
      channelId: req.headers?.['x-channel-id'] ?? '',
      ctxId: req.headers?.['x-context-id'] || nanoid(),
    });
    next();
  });

  app.use(helmet());
  app.use(
    json({
      limit: '3mb',
    }),
  );
  app.use(
    urlencoded({
      limit: '3mb',
      extended: true,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      errorHttpStatusCode: 422,
    }),
  );

  if (process.env.NODE_ENV === 'local' && false) {
    const options = new DocumentBuilder()
      .setTitle('Kissbot integrations')
      .setDescription('Kissbot integrations')
      .setVersion('1.0')
      .addTag('kissbot-integrations')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(config.get<number>('app.port'));
}

bootstrap();
