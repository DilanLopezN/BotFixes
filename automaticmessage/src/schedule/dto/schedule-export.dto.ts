import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleFilterListDto } from './schedule-query.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para exportação de dados com colunas configuráveis, vai ser usado na API
 */
export class ScheduleExportDto {
  @ApiProperty({
    description: 'Filtros aplicados na listagem',
    type: ScheduleFilterListDto,
  })
  @ValidateNested()
  @Type(() => ScheduleFilterListDto)
  filter: ScheduleFilterListDto;

  @ApiPropertyOptional({
    description: 'Colunas selecionadas para exportação',
    type: [String],
    example: ['patientCode', 'patientName', 'doctorName', 'status'],
    enum: [
      'patientCode',
      'patientName',
      'doctorName',
      'scheduleDate',
      'status',
      'sendType',
      'procedureName',
      'appointmentTypeName',
      'organizationUnitName',
      'insuranceName',
      'insurancePlanName',
      'cancelReasonName',
      'recipientType',
      'scheduleCode',
      'email',
      'phone',
      'specialityName',
      'organizationUnitCode',
      'procedureCode',
      'doctorCode',
      'appointmentTypeCode',
      'insuranceCode',
      'insurancePlanCode',
      'groupDescription',
      'sendedAt',
      'responseAt',
      'npsScore',
      'npsScoreComment',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedColumns?: string[];
}

/**
 * Enum com os campos disponíveis para exportação
 */
export enum ExportableFields {
  PATIENT_CODE = 'patientCode',
  PATIENT_NAME = 'patientName',
  DOCTOR_NAME = 'doctorName',
  SCHEDULE_DATE = 'scheduleDate',
  STATUS = 'status',
  SEND_TYPE = 'sendType',
  PROCEDURE_NAME = 'procedureName',
  APPOINTMENT_TYPE_NAME = 'appointmentTypeName',
  ORGANIZATION_UNIT_NAME = 'organizationUnitName',
  INSURANCE_NAME = 'insuranceName',
  INSURANCE_PLAN_NAME = 'insurancePlanName',
  CANCEL_REASON_NAME = 'cancelReasonName',
  RECIPIENT_TYPE = 'recipientType',
  SCHEDULE_CODE = 'scheduleCode',
  EMAIL = 'email',
  PHONE = 'phone',
  SPECIALITY_NAME = 'specialityName',
  ORGANIZATION_UNIT_CODE = 'organizationUnitCode',
  PROCEDURE_CODE = 'procedureCode',
  DOCTOR_CODE = 'doctorCode',
  APPOINTMENT_TYPE_CODE = 'appointmentTypeCode',
  INSURANCE_CODE = 'insuranceCode',
  INSURANCE_PLAN_CODE = 'insurancePlanCode',
  GROUP_DESCRIPTION = 'groupDescription',
  SENDED_AT = 'sendedAt',
  RESPONSE_AT = 'responseAt',
  NPS_SCORE = 'npsScore',
  NPS_SCORE_COMMENT = 'npsScoreComment',
}

/**
 * Configuração de campos padrão para exportação
 */
export const DEFAULT_EXPORT_FIELDS = [
  ExportableFields.PATIENT_NAME,
  ExportableFields.PATIENT_CODE,
  ExportableFields.EMAIL,
  ExportableFields.PHONE,
];

/**
 * Mapeamento de campos para labels de exportação
 */
export const FIELD_LABELS = {
  [ExportableFields.PATIENT_CODE]: 'Cód. Paciente',
  [ExportableFields.PATIENT_NAME]: 'Paciente',
  [ExportableFields.DOCTOR_NAME]: 'Médico',
  [ExportableFields.SCHEDULE_DATE]: 'Agendamento',
  [ExportableFields.STATUS]: 'Status',
  [ExportableFields.SEND_TYPE]: 'Tipo',
  [ExportableFields.PROCEDURE_NAME]: 'Procedimento',
  [ExportableFields.APPOINTMENT_TYPE_NAME]: 'Tipo de Agendamento',
  [ExportableFields.ORGANIZATION_UNIT_NAME]: 'Unidade',
  [ExportableFields.INSURANCE_NAME]: 'Convênio',
  [ExportableFields.INSURANCE_PLAN_NAME]: 'Plano do Convênio',
  [ExportableFields.CANCEL_REASON_NAME]: 'Motivo do Cancelamento',
  [ExportableFields.RECIPIENT_TYPE]: 'Canal',
  [ExportableFields.SCHEDULE_CODE]: 'Cód. Agendamento',
  [ExportableFields.EMAIL]: 'Email',
  [ExportableFields.PHONE]: 'Telefone',
  [ExportableFields.SPECIALITY_NAME]: 'Especialidade',
  [ExportableFields.ORGANIZATION_UNIT_CODE]: 'Cód. Unidade',
  [ExportableFields.PROCEDURE_CODE]: 'Cód. Procedimento',
  [ExportableFields.DOCTOR_CODE]: 'Cód. Médico',
  [ExportableFields.APPOINTMENT_TYPE_CODE]: 'Cód. Tipo Agendamento',
  [ExportableFields.INSURANCE_CODE]: 'Cód. Convênio',
  [ExportableFields.INSURANCE_PLAN_CODE]: 'Cód. Plano',
  [ExportableFields.GROUP_DESCRIPTION]: 'Descrição do Grupo',
  [ExportableFields.SENDED_AT]: 'Data de Envio',
  [ExportableFields.RESPONSE_AT]: 'Data de Resposta',
  [ExportableFields.NPS_SCORE]: 'Nota NPS',
  [ExportableFields.NPS_SCORE_COMMENT]: 'Comentário NPS',
};
