import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from 'kissbot-entities';
import { ANALYTICS_CONNECTION_NAME } from '../../ormconfig';
import { AppointmentService } from './appointment.service';
import { PatientDataModule } from '../../patient-data/patient-data.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment], ANALYTICS_CONNECTION_NAME), PatientDataModule, AuditModule],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
