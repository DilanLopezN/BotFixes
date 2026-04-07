import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EntitiesModule } from '../../entities/entities.module';
import { SharedModule } from '../../shared/shared.module';
import { IntegrationModule } from '../../integration/integration.module';
import { SchedulingModule } from '../../scheduling/scheduling.module';
import { ApiModule } from '../../api/api.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { CacheModule } from '../../../core/cache/cache.module';
import { ShiftService } from './services/shift.service';
import { ShiftApiService } from './services/shift-api.service';
import { ShiftController } from './controllers/shift.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 120_000,
    }),
    EntitiesModule,
    SharedModule,
    IntegrationModule,
    SchedulingModule,
    ApiModule,
    AuditModule,
    CredentialsModule,
    CacheModule,
  ],
  controllers: [ShiftController],
  providers: [ShiftService, ShiftApiService],
  exports: [ShiftService],
})
export class ShiftModule {}
