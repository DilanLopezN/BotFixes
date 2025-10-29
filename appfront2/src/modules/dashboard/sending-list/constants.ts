import { SendingType } from '~/constants/sending-type';
import { localeKeys } from '~/i18n';
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
  [SendingStatus.CONFIRM_RESCHEDULE]: {
    label: constantsLocaleKeys.sendingStatus.confirmReschedule,
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
  [SendingStatus.DOCUMENT_UPLOADED]: {
    label: constantsLocaleKeys.sendingStatus.documentUploaded,
    color: '#13c2c2',
  },
};

export const sendTypeColumLabelMap = {
  [SendingType.confirmation]: constantsLocaleKeys.sendingType.confirmation,
  [SendingType.reminder]: constantsLocaleKeys.sendingType.reminder,
  [SendingType.nps]: constantsLocaleKeys.sendingType.nps,
  [SendingType.medical_report]: constantsLocaleKeys.sendingType.medical_report,
  [SendingType.schedule_notification]: constantsLocaleKeys.sendingType.schedule_notification,
  [SendingType.documents_request]: constantsLocaleKeys.sendingType.documents_request,
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

export enum ExportOption {
  downloadPNG = 'downloadPNG',
  downloadJPEG = 'downloadJPEG',
  downloadPDF = 'downloadPDF',
  downloadSVG = 'downloadSVG',
  downloadCSV = 'downloadCSV',
  downloadXLS = 'downloadXLS',
  viewData = 'viewData',
  printChart = 'printChart',
}
