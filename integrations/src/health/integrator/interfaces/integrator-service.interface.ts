import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { DoctorEntityDocument, EntityDocument, InsuranceEntityDocument } from '../../entities/schema';
import {
  Appointment,
  AppointmentValue,
  FollowUpAppointment,
  MinifiedAppointments,
} from '../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../interfaces/correlation-filter.interface';
import { EntityListByText } from '../../interfaces/entity-list-text.interface';
import { EntityType, EntityTypes } from '../../interfaces/entity.interface';
import { Patient } from '../../interfaces/patient.interface';
import {
  CreateSchedule,
  CancelSchedule,
  CancelScheduleV2,
  Reschedule,
  PatientFilters,
  CreatePatient,
  UpdatePatient,
  ListAvailableSchedules,
  ConfirmSchedule,
  ConfirmScheduleV2,
  GetScheduleValue,
  PatientFollowUpSchedules,
  ListSchedulesToConfirm,
  ListSchedulesToConfirmV2,
  PatientSchedules,
  InitialPatient,
  MatchFlowsConfirmation,
  ValidateScheduleConfirmation,
  ListAvailableSchedulesResponse,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  DownloadDocumentData,
  ListAvailableMedicalReports,
  ValidPatientReportDownloadRequest,
  CountAvailableMedicalReportsResponse,
  ListAvailableMedicalReportsFilterRequest,
  ListAvailableMedicalReportsTokenData,
  HasAvailableMedicalReportsFilterRequest,
  HasAvailableMedicalReportsFilterResponse,
  ListAvailableMedicalReportsByPatientCode,
  DocumentUploadFileType,
  AgentUploadFile,
  PatientUploadFile,
} from './';
import { OnDutyMedicalScale } from '../../interfaces/on-duty-medical-scale.interface';
import { ConfirmationSchedule } from '../../interfaces/confirmation-schedule.interface';
import { FlowAction } from '../../flow/interfaces/flow.interface';
import {
  FindDoctorParams,
  FindDoctorResponse,
  ListDoctorSchedulesParams,
  ListDoctorSchedulesResponse,
  RecoverAccessProtocol,
  RecoverAccessProtocolResponse,
} from 'kissbot-health-core';
import { GetScheduleByIdData } from './get-schedule-by-id.interface';
import { Schedules } from '../../schedules/entities/schedules.entity';
import { ValidatePatientRecoverAccessProtocol } from '../../integrations/matrix-integration/interfaces/recover-password.interface';
import { DownloadMedicalReportTokenData } from '../../scheduling/interfaces/download-token.interface';
import { ListSchedules } from '../../scheduling/interfaces/list-schedules.interface';
import { ListSuggestedDoctors } from './list-suggested-doctors.interface';
import { AgentDeleteFile } from './documents/agent-delete-file.interface';
import { PatientDeleteFile } from './documents/patient-delete-file.interface';
import { ExtractedSchedule } from '../../schedules/interfaces/extracted-schedule.interface';

export interface IIntegratorService {
  cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse>;
  confirmSchedule(integration: IntegrationDocument, confirmSchedule: ConfirmSchedule): Promise<OkResponse>;
  createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment>;
  createPatient(integration: IntegrationDocument, patient: CreatePatient): Promise<Patient>;
  extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilter?: CorrelationFilter,
    cache?: boolean,
    fromImport?: boolean,
  ): Promise<EntityTypes[]>;
  getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse>;
  getScheduleValue(integration: IntegrationDocument, scheduleValue: GetScheduleValue): Promise<AppointmentValue>;
  getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
    dateLimit?: number,
  ): Promise<EntityDocument[]>;
  getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments>;
  getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter>;
  getConfirmationScheduleById?(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules>;
  getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient>;
  getPatientSchedules(integration: IntegrationDocument, patientSchedules: PatientSchedules): Promise<Appointment[]>;
  getStatus(integration: IntegrationDocument): Promise<OkResponse>;
  reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment>;
  updatePatient(integration: IntegrationDocument, patientCode: string, patient: UpdatePatient): Promise<Patient>;

  confirmationCancelSchedule?(integration: IntegrationDocument, cancelSchedule: CancelScheduleV2): Promise<OkResponse>;
  confirmationConfirmSchedule?(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse>;
  getConfirmationScheduleGuidance?(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse>;

  getEntitiesFromInsurance?(
    integration: IntegrationDocument,
    insurance: InsuranceEntityDocument,
    cpf: string,
  ): Promise<CorrelationFilter>;
  extractAllEntities?: (integration: IntegrationDocument) => Promise<OkResponse>;
  getEntityListByText?(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    text: string,
    patient?: InitialPatient,
  ): Promise<EntityListByText>;
  getPatientFollowUpSchedules?(
    integration: IntegrationDocument,
    filters: PatientFollowUpSchedules,
  ): Promise<FollowUpAppointment[]>;
  matchFlowsConfirmation?(integration: IntegrationDocument, data: MatchFlowsConfirmation): Promise<FlowAction[]>;
  listSchedulesToConfirm?(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirm | ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule>;
  listOnDutyMedicalScale?(integration: IntegrationDocument): Promise<OnDutyMedicalScale[]>;

  validateScheduleData?(integration: IntegrationDocument, data: ValidateScheduleConfirmation): Promise<OkResponse>;

  findDoctor?(integration: IntegrationDocument, data: FindDoctorParams): Promise<FindDoctorResponse>;
  listDoctorSchedules?(
    integration: IntegrationDocument,
    data: ListDoctorSchedulesParams,
  ): Promise<ListDoctorSchedulesResponse[]>;

  downloadDocument?(integration: IntegrationDocument, data: DownloadDocumentData): Promise<Buffer>;

  downloadMedicalReport?(integration: IntegrationDocument, data: DownloadMedicalReportTokenData): Promise<Buffer>;
  getMedicalReportUrl?(integration: IntegrationDocument, data: DownloadMedicalReportTokenData): Promise<string>;
  listAvailableMedicalReports?(
    integration: IntegrationDocument,
    data: ListAvailableMedicalReportsTokenData,
    filter: ListAvailableMedicalReportsFilterRequest,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReports>>;
  listAvailableMedicalReportsByPatientCode?(
    integration: IntegrationDocument,
    data: ListAvailableMedicalReportsTokenData,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReportsByPatientCode>>;
  validatePatientReportDownload?(
    integration: IntegrationDocument,
    body: ValidPatientReportDownloadRequest,
  ): Promise<boolean>;
  hasAvailableMedicalReports?(
    integration: IntegrationDocument,
    data: ListSchedules,
    filter: HasAvailableMedicalReportsFilterRequest,
  ): Promise<HasAvailableMedicalReportsFilterResponse>;

  validateRecoverAccessProtocol?(
    integration: IntegrationDocument,
    data: ValidatePatientRecoverAccessProtocol,
  ): Promise<{ ok: boolean }>;

  recoverAccessProtocol?(
    integration: IntegrationDocument,
    data: RecoverAccessProtocol,
  ): Promise<RecoverAccessProtocolResponse>;

  listSuggestedDoctors?(
    integration: IntegrationDocument,
    filter: ListSuggestedDoctors,
  ): Promise<DoctorEntityDocument[]>;

  listSchedulesToActiveSending?(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]>;

  listFileTypesToUpload?(integration: IntegrationDocument): Promise<DocumentUploadFileType[]>;
  patientUploadScheduleFile?(integration: IntegrationDocument, data: PatientUploadFile): Promise<OkResponse>;
  agentUploadScheduleFile?(integration: IntegrationDocument, data: AgentUploadFile): Promise<OkResponse>;
  agentDeleteScheduleFile?(integration: IntegrationDocument, data: AgentDeleteFile): Promise<OkResponse>;
  patientDeleteScheduleFile?(integration: IntegrationDocument, data: PatientDeleteFile): Promise<OkResponse>;
}
