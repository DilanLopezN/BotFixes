import { Module } from '@nestjs/common';
import { PatientAcceptanceService } from './patient-acceptance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientAcceptance } from './patient-acceptance.entity';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { PatientAcceptanceController } from './patient-acceptance.controller';
import { IntegrationModule } from '../integration/integration.module';
import { PatientDataModule } from '../patient-data/patient-data.module';
import { IntegratorModule } from '../integrator/integrator.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientAcceptance], INTEGRATIONS_CONNECTION_NAME),
    IntegrationModule,
    PatientDataModule,
    IntegratorModule,
    AuditModule,
  ],
  providers: [PatientAcceptanceService],
  exports: [PatientAcceptanceService],
  controllers: [PatientAcceptanceController],
})
export class PatientAcceptanceModule {}
