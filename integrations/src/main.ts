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
  Sentry.init({
    dsn: 'https://c8ee1df6b13c406aa8e813032a504077@o55573.ingest.sentry.io/5774465',
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.2,
    sampleRate: 0.1,
    maxBreadcrumbs: 10,
    attachStacktrace: true,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.onUncaughtExceptionIntegration({
        exitEvenIfOtherHandlersAreRegistered: false,
      }),
      Sentry.onUnhandledRejectionIntegration({
        mode: 'warn',
      }),
    ],
    ignoreErrors: ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'AbortError', 'Request aborted', 'canceled'],
    beforeSend(event) {
      if (event?.request?.headers) {
        delete event.request.headers['authorization'];
      }

      return event;
    },
  });
}

process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception:', err);

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(err, {
      level: 'fatal',
      tags: {
        handler: 'uncaughtException',
      },
    });

    Sentry.flush(2000)
      .then(() => {
        process.exit(1);
      })
      .catch((flushErr) => {
        console.error('Sentry flush failed:', flushErr);
        process.exit(1);
      });
  }
});

process.on('unhandledRejection', function (reason, promise) {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(reason, {
      level: 'error',
      tags: {
        handler: 'unhandledRejection',
      },
    });
  }
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

  app.use(contextService.middleware('request'));
  app.use(function (req: Request, _, next: NextFunction) {
    contextService.set('req:default-headers', {
      conversationId: req.headers?.['x-conversation-id'] ?? '',
      workspaceId: req.headers?.['x-workspace-id'] ?? '',
      memberId: req.headers?.['x-member-id'] ?? '',
      channelId: req.headers?.['x-channel-id'] ?? '',
      ctxId: req.headers?.['x-context-id'] || nanoid(5),
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
