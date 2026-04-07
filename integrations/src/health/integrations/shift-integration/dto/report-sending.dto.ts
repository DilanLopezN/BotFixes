import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportSending } from 'kissbot-health-core';
import { PatientSchedule } from 'kissbot-health-core';

export class ReportSendingDto implements ReportSending {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  integrationId: string;

  @IsNotEmpty()
  @IsString()
  patientCode: string;

  @IsNotEmpty()
  @IsString()
  patientCpf: string;

  @IsNotEmpty()
  @IsString()
  scheduleCode: string;

  @IsNotEmpty()
  @IsString()
  patientName: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  scheduleDate: string;

  // Campos opcionais
  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  groupScheduleCode: string;

  @IsOptional()
  @IsString()
  procedureCode: string;

  @IsOptional()
  @IsString()
  modality: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  filename: string;

  @IsOptional()
  @IsString()
  whatsappCode: string;

  @IsOptional()
  @IsString()
  autoIe: string;

  @IsOptional()
  @IsString()
  whatsappStatus: string;

  @IsOptional()
  @IsString()
  filepath: string;

  @IsOptional()
  @IsString()
  createdAt: string;

  @IsOptional()
  @IsString()
  sentAt: string;

  @IsOptional()
  @IsString()
  accessedAt: string;

  @IsOptional()
  schedule: PatientSchedule;
}
