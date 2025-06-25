import { CacheService } from './../_core/cache/cache.service';
import { Injectable, HttpException, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AmqpService } from '../_core/amqp/amqp.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { KafkaService } from '../_core/kafka/kafka.service';
import { ExternalDataService } from './external-data.service';

@Injectable()
export class StatusService {
    private readonly logger = new Logger(StatusService.name);
    constructor(
        private cacheService: CacheService,
        private amqpConn: AmqpConnection,
        private readonly amqpService: AmqpService,
        @InjectConnection() private connection: Connection,
        private kafkaService: KafkaService,
        private externalDataService: ExternalDataService,
    ) { }

    async getStatusObject() {
        const db = await this.wrapper(this.mongo, 'mongo');
        const amqp = await this.wrapper(this.rabbitMqSub, 'rabbitMqSub');
        const amqpPub = await this.wrapper(this.rabbitMqPub, 'rabbitMqPub');
        const redis = await this.wrapper(this.redis, 'redis');
        const kafka = await this.wrapper(this.kafkaConsumers, 'kafka');
        const psql = await this.wrapper(this.psql, 'psql');
        return {
            db,
            amqp,
            amqpPub,
            redis,
            kafka,
            psql,
        };
    }

    async status() {
        const status = await this.getStatusObject();
        let isError = false;
        Object.keys(status).forEach(key => {
            if (!status[key].running) {
                isError = true;
            }
        });
        if (isError) {
            throw new HttpException(JSON.stringify(status), 500);
        }
        return status;
    }

    rabbitMqSub = async (): Promise<string | boolean> => {
        const result = this.amqpConn.connected;
        return result;
    }

    kafkaConsumers = async (): Promise<string | boolean> => {
        return await this.kafkaService.ping();
    }

    rabbitMqPub = async (): Promise<string | boolean> => {
        const result = await this.amqpService.status();
        return result;
    }

    redis = async (): Promise<string | boolean> => {
        try {
            const result = await this.cacheService.status();
            return result;
        } catch (error) {
            return false;
        }
    }

    mongo = async (): Promise<string | boolean> => {
        try {
            const result = await this.connection.db.command({
                ping: 1,
            });
            return result?.ok == 1;
        } catch (e) {
            Sentry.captureException(e);
            return false;
        }
    }

    psql = async (): Promise<string | boolean> => {
        try {
            return await this.externalDataService.checkConnectionsPsql();
        } catch (e) {
            Sentry.captureException(e);
            console.log(`StatusService.psql`, e);
            return false;
        }
    }

    private async wrapper(check: () => Promise<string | boolean>, checker: string) {
        return new Promise((res, rej) => {
            const timer = setTimeout(() => {
                Sentry.captureEvent({
                    message: 'timeoutApiChecker', extra: {
                        timeoutApiChecker: checker,
                    }
                });
                res({running: false})
            }, 2500);
            check().then(success => {
                clearTimeout(timer);
                res({running: success})
            })
        })}

    getKafkaList = async (): Promise<any> => {
        return await this.kafkaService.getKafkaList();
    }
}
