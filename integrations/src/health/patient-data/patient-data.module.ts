import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { PatientData } from './patient-data.entity';
import { PatientDataService } from './patient-data.service';

@Module({
  imports: [TypeOrmModule.forFeature([PatientData], INTEGRATIONS_CONNECTION_NAME)],
  providers: [PatientDataService],
  exports: [PatientDataService],
})
export class PatientDataModule {}
