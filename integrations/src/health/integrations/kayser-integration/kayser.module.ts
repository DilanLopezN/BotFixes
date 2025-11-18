import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { KayserApiService } from './services/kayser-api.service';
import { KayserConfirmationService } from './services/kayser-confirmation.service';
import { KayserService } from './services/kayser.service';
import { SharedModule } from '../../shared/shared.module';
import { AuditModule } from '../../audit/audit.module';
import { SchedulesModule } from '../../schedules/schedules.module';
import { FlowModule } from '../../flow/flow.module';
import { CredentialsModule } from '../../credentials/credentials.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 150_000,
    }),
    SharedModule,
    AuditModule,
    SchedulesModule,
    FlowModule,
    CredentialsModule,
  ],
  providers: [KayserService, KayserApiService, KayserConfirmationService],
})
export class KayserModule {}
