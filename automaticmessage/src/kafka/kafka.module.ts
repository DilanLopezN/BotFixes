import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { Kafka, KafkaConfig, Partitioners } from 'kafkajs';
import { KafkaService } from './kafka.service';

export const KAFKA_INJECT_TOKEN = 'KAFKA_INJECT_TOKEN';
export const KAFKA_ADMIN_INJECT_TOKEN = 'KAFKA_ADMIN_INJECT_TOKEN';
export const KAFKA_PRODUCER_INJECT_TOKEN = 'KAFKA_PRODUCER_INJECT_TOKEN';

@Module({})
@Global()
export class KafkaModule {
  static async forRoot(options: KafkaConfig): Promise<DynamicModule> {
    if (process.env.NODE_ENV == 'local') {
      options.ssl = false;
      delete options.sasl;
    }
    const logger = new Logger(KafkaModule.name);
    const kafka = new Kafka(options);
    const admin = kafka.admin();
    admin.on('admin.connect', () => {
      logger.log('Kafka admin connected');
    });
    await admin.connect();
    const producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    producer.on('producer.connect', () => {
      logger.log('Kafka producer connected');
    });
    await producer.connect();
    logger.log('Kafka module started succesfully');
    return {
      providers: [
        {
          provide: KAFKA_INJECT_TOKEN,
          useValue: kafka,
        },
        {
          provide: KAFKA_ADMIN_INJECT_TOKEN,
          useValue: admin,
        },
        {
          provide: KAFKA_PRODUCER_INJECT_TOKEN,
          useValue: producer,
        },
        KafkaService,
      ],
      exports: [KafkaService],
      imports: [],
      module: KafkaModule,
    };
  }
}
