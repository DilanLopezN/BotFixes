import { forwardRef, Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documents } from './entities/documents.entity';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { S3Module } from '../../common/s3-module/s3.module';
import { IntegratorModule } from '../integrator/integrator.module';
import { IntegrationModule } from '../integration/integration.module';
import { IntegrationCacheUtilsModule } from '../integration-cache-utils/integration-cache-utils.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documents], INTEGRATIONS_CONNECTION_NAME),
    IntegrationModule,
    S3Module,
    forwardRef(() => IntegratorModule),
    IntegrationCacheUtilsModule,
    AuditModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
