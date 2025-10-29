import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import * as fs from 'fs';
import * as Sentry from '@sentry/node';
import * as express from 'express';
import * as compression from 'compression';

import { collectDefaultMetrics } from 'prom-client';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { shouldRunCron, shouldStartInternalApi, shouldStartRabbit } from './common/utils/bootstrapOptions';
collectDefaultMetrics({
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // These are the default bucket
});

if (fs.existsSync('../.env')) {
    dotenv.config({ path: '../.env' });
}

if (fs.existsSync('../../.env')) {
    dotenv.config({ path: '../../.env' });
}

dotenv.config();

async function bootstrap() {
    try {
        const logger = new Logger('Bootstrap');
        const app: INestApplication = await NestFactory.create(AppModule);
        app.enableCors({
            origin: '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            maxAge: 600,
            allowedHeaders: '*',
            preflightContinue: false,
        });

        app.use(
            express.json({
                limit: '600kb',
            }),
        );

        app.use(
            compression({
                level: 3,
            }),
        );
        app.use(
            helmet({
                crossOriginResourcePolicy: false,
            }),
        );
        if (process.env.NODE_ENV == 'production') {
            Sentry.init({ dsn: 'https://423734c40f3f4beea74f4f0fbfe63b39@o55573.ingest.sentry.io/5507747' });
        }
        logger.log(`Starting app as NODE_ENV = ${process.env.NODE_ENV} | START_TYPE = ${process.env.START_TYPE}`);
        logger.log(`Starting app as shouldRunCron: ${shouldRunCron()}`);
        logger.log(`Starting app as shouldStartInternalApi: ${shouldStartInternalApi()}`);
        logger.log(`Starting app as shouldStartRabbit: ${shouldStartRabbit()}`);

        if (process.env.NODE_ENV === 'local') {
            const options = new DocumentBuilder()
                .setTitle('Kissbot api')
                .setDescription('Kissbot api')
                .setVersion('1.0')
                .addTag('kissbot-api')
                .addBearerAuth()
                .build();

            const document = SwaggerModule.createDocument(app, options);
            SwaggerModule.setup('api', app, document);
        }

        process.on('uncaughtException', function (err) {
            Sentry.captureEvent({
                message: 'uncaughtException',
                extra: {
                    data: 'Caught exception',
                    err,
                },
            });
        });
        await app.listen(process.env.PORT || 9091);
    } catch (e) {}
}

bootstrap();