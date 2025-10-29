import { SendingType } from '~/constants/sending-type';
import { localeKeys } from '~/i18n';
import { ExportableFields } from '~/services/workspace/export-list-schedules-csv/interfaces';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';

const { constants: constantsLocaleKeys } = localeKeys.dashboard.sendingList;

export const statusColumLabelMap = {
  [SendingStatus.CONFIRMED]: {
    label: constantsLocaleKeys.sendingStatus.confirmed,
    color: '#52c41a',
  },
  [SendingStatus.SENDED]: {
    label: constantsLocaleKeys.sendingStatus.sent,
    color: undefined,
  },
  [SendingStatus.CANCELED]: {
    label: constantsLocaleKeys.sendingStatus.canceled,
    color: '#f5222d',
  },
  [SendingStatus.INVALID]: {
    label: constantsLocaleKeys.sendingStatus.invalidNumber,
    color: '#fa8c16',
  },
  [SendingStatus.NOT_ANSWERED]: {
    label: constantsLocaleKeys.sendingStatus.sent,
    color: undefined,
  },
  [SendingStatus.OPEN_CVS]: {
    label: constantsLocaleKeys.sendingStatus.openedConversation,
    color: undefined,
  },
  [SendingStatus.RESCHEDULE]: {
    label: constantsLocaleKeys.sendingStatus.rescheduled,
    color: undefined,
  },
  [SendingStatus.NO_RECIPIENT]: {
    label: constantsLocaleKeys.sendingStatus.noRecipient,
    color: undefined,
  },
  [SendingStatus.INVALID_RECIPIENT]: {
    label: constantsLocaleKeys.sendingStatus.invalidRecipíent,
    color: undefined,
  },
  [SendingStatus.INDIVIDUAL_CANCEL]: {
    label: constantsLocaleKeys.sendingStatus.individualCancel,
    color: undefined,
  },
  [SendingStatus.START_RESCHEDULE_RECOVER]: {
    label: constantsLocaleKeys.sendingStatus.startRescheduleRecover,
    color: undefined,
  },
  [SendingStatus.CONFIRM_RESCHEDULE_RECOVER]: {
    label: constantsLocaleKeys.sendingStatus.confirmRescheduleRecover,
    color: undefined,
  },
  [SendingStatus.CANCEL_RESCHEDULE_RECOVER]: {
    label: constantsLocaleKeys.sendingStatus.cancelRescheduleRecover,
    color: undefined,
  },
};

export const sendTypeColumLabelMap = {
  [SendingType.confirmation]: constantsLocaleKeys.sendingType.confirmation,
  [SendingType.reminder]: constantsLocaleKeys.sendingType.reminder,
  [SendingType.nps]: constantsLocaleKeys.sendingType.nps,
  [SendingType.medical_report]: constantsLocaleKeys.sendingType.medical_report,
  [SendingType.schedule_notification]: constantsLocaleKeys.sendingType.schedule_notification,
  [SendingType.nps_score]: constantsLocaleKeys.sendingType.nps_score,
  [SendingType.recover_lost_schedule]: constantsLocaleKeys.sendingType.recover_lost_schedule,
};

export enum FeedbackEnum {
  all = 'all ',
  withFeedback = 'withFeedback',
  noFeedback = 'noFeedback',
}
export enum RecipientTypeEnum {
  all = 'all ',
  email = 'email',
  whatsApp = 'whatsApp',
}

export interface TableColumnConfig {
  key: ExportableFields;
  label: string;
  visible: boolean;
  required?: boolean; // Se é campo obrigatório na exportação
  width?: number;
}

export const DEFAULT_TABLE_COLUMNS: TableColumnConfig[] = [
  {
    key: ExportableFields.PATIENT_CODE,
    label: 'Cód. Paciente',
    visible: true,
    required: true,
    width: 150,
  },
  {
    key: ExportableFields.PATIENT_NAME,
    label: 'Paciente',
    visible: true,
    required: true,
    width: 200,
  },
  {
    key: ExportableFields.EMAIL,
    label: 'Email',
    visible: false,
    required: true,
    width: 200,
  },
  {
    key: ExportableFields.PHONE,
    label: 'Telefone',
    visible: false,
    required: true,
    width: 150,
  },
  {
    key: ExportableFields.DOCTOR_NAME,
    label: 'Médico',
    visible: true,
    width: 200,
  },
  {
    key: ExportableFields.DOCTOR_CODE,
    label: 'Cód. Médico',
    visible: false,
    width: 120,
  },
  {
    key: ExportableFields.SCHEDULE_DATE,
    label: 'Agendamento',
    visible: true,
    width: 170,
  },
  {
    key: ExportableFields.STATUS,
    label: 'Status',
    visible: true,
    width: 150,
  },
  {
    key: ExportableFields.SEND_TYPE,
    label: 'Tipo',
    visible: true,
    width: 170,
  },
  {
    key: ExportableFields.PROCEDURE_NAME,
    label: 'Procedimento',
    visible: true,
    width: 200,
  },
  {
    key: ExportableFields.PROCEDURE_CODE,
    label: 'Cód. Procedimento',
    visible: false,
    width: 150,
  },
  {
    key: ExportableFields.APPOINTMENT_TYPE_NAME,
    label: 'Tipo de Agendamento',
    visible: true,
    width: 200,
  },
  {
    key: ExportableFields.APPOINTMENT_TYPE_CODE,
    label: 'Cód. Tipo Agendamento',
    visible: false,
    width: 150,
  },
  {
    key: ExportableFields.ORGANIZATION_UNIT_NAME,
    label: 'Unidade',
    visible: true,
    width: 200,
  },
  {
    key: ExportableFields.ORGANIZATION_UNIT_CODE,
    label: 'Cód. Unidade',
    visible: false,
    width: 120,
  },
  {
    key: ExportableFields.SPECIALITY_NAME,
    label: 'Especialidade',
    visible: false,
    width: 200,
  },
  {
    key: ExportableFields.SPECIALITY_CODE,
    label: 'Cód. Especialidade',
    visible: false,
    width: 120,
  },
  {
    key: ExportableFields.INSURANCE_NAME,
    label: 'Convênio',
    visible: true,
    width: 200,
  },
  {
    key: ExportableFields.INSURANCE_CODE,
    label: 'Cód. Convênio',
    visible: false,
    width: 120,
  },
  {
    key: ExportableFields.INSURANCE_PLAN_NAME,
    label: 'Plano do Convênio',
    visible: true,
    width: 200,
  },
  {
    key: ExportableFields.INSURANCE_PLAN_CODE,
    label: 'Cód. Plano',
    visible: false,
    width: 120,
  },
  {
    key: ExportableFields.CANCEL_REASON_NAME,
    label: 'Motivo do Cancelamento',
    visible: false,
    width: 200,
  },
  {
    key: ExportableFields.RECIPIENT_TYPE,
    label: 'Canal',
    visible: true,
    width: 120,
  },
  {
    key: ExportableFields.SCHEDULE_CODE,
    label: 'Cód. Agendamento',
    visible: false,
    width: 150,
  },
  {
    key: ExportableFields.GROUP_DESCRIPTION,
    label: 'Descrição do Grupo',
    visible: false,
    width: 300,
  },
  {
    key: ExportableFields.SENDED_AT,
    label: 'Data de Envio',
    visible: false,
    width: 170,
  },
  {
    key: ExportableFields.RESPONSE_AT,
    label: 'Data de Resposta',
    visible: false,
    width: 170,
  },
  {
    key: ExportableFields.NPS_SCORE,
    label: 'Nota NPS',
    visible: false,
    width: 100,
  },
  {
    key: ExportableFields.NPS_SCORE_COMMENT,
    label: 'Comentário NPS',
    visible: false,
    width: 300,
  },
];
