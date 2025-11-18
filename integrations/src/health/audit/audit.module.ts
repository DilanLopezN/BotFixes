import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationModule } from '../integration/integration.module';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { Audit } from './audit.entity';
import { AuditService } from './services/audit.service';
import { AuditConsumerService } from './services/audit-consumer.service';
import { EventsModule } from '../events/events.module';
import { RabbitModule } from '../../common/rabbit-module/rabbit.module';
import { CacheModule } from '../../core/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Audit], INTEGRATIONS_CONNECTION_NAME),
    IntegrationModule,
    EventsModule,
    RabbitModule,
    CacheModule,
  ],
  providers: [AuditService, AuditConsumerService],
  exports: [AuditService, AuditConsumerService],
})
export class AuditModule {}
