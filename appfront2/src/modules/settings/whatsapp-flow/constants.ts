import { FlowCategoryEnum } from '~/constants/flow-category';
import { FlowStatusEnum } from '~/constants/flow-status';
import { localeKeys } from '~/i18n';
import { FlowStatusBadgeType } from './interfaces';

export const maxScreenSizeToCompactActions = 1350;
const whatsAppFlowStatusLocaleKeys = localeKeys.settings.whatsAppFlow.constants.status;

const whatsAppFlowLocaleKeys = localeKeys.settings.whatsAppFlow.constants.categories;
const whatsAppFlowHelpLocaleKeys =
  localeKeys.settings.whatsAppFlow.constants.categories.categoriesHelpText;

export const flowCategoryLabelMap: Record<FlowCategoryEnum, string> = {
  [FlowCategoryEnum.SIGN_UP]: whatsAppFlowLocaleKeys.signUp,
  [FlowCategoryEnum.SIGN_IN]: whatsAppFlowLocaleKeys.signIn,
  [FlowCategoryEnum.APPOINTMENT_BOOKING]: whatsAppFlowLocaleKeys.appointmentBooking,
  [FlowCategoryEnum.LEAD_GENERATION]: whatsAppFlowLocaleKeys.leadGeneration,
  [FlowCategoryEnum.CONTACT_US]: whatsAppFlowLocaleKeys.contactUs,
  [FlowCategoryEnum.CUSTOMER_SUPPORT]: whatsAppFlowLocaleKeys.customerSupport,
  [FlowCategoryEnum.SURVEY]: whatsAppFlowLocaleKeys.survey,
  [FlowCategoryEnum.OTHER]: whatsAppFlowLocaleKeys.other,
};

export const flowCategoryHelpMap: Record<FlowCategoryEnum, string> = {
  [FlowCategoryEnum.SIGN_UP]: whatsAppFlowHelpLocaleKeys.signUpHelpText,
  [FlowCategoryEnum.SIGN_IN]: whatsAppFlowHelpLocaleKeys.signInHelpText,
  [FlowCategoryEnum.APPOINTMENT_BOOKING]: whatsAppFlowHelpLocaleKeys.appointmentBookingHelpText,
  [FlowCategoryEnum.LEAD_GENERATION]: whatsAppFlowHelpLocaleKeys.leadGenerationHelpText,
  [FlowCategoryEnum.CONTACT_US]: whatsAppFlowHelpLocaleKeys.contactUsHelpText,
  [FlowCategoryEnum.CUSTOMER_SUPPORT]: whatsAppFlowHelpLocaleKeys.customerSupportHelpText,
  [FlowCategoryEnum.SURVEY]: whatsAppFlowHelpLocaleKeys.surveyHelpText,
  [FlowCategoryEnum.OTHER]: whatsAppFlowHelpLocaleKeys.otherHelpText,
};

export const flowStatusLabelMap: Record<FlowStatusEnum, string> = {
  [FlowStatusEnum.PUBLISHED]: whatsAppFlowStatusLocaleKeys.published,
  [FlowStatusEnum.DRAFT]: whatsAppFlowStatusLocaleKeys.draft,
  [FlowStatusEnum.DEPRECATED]: whatsAppFlowStatusLocaleKeys.deprecated,
  [FlowStatusEnum.BLOCKED]: whatsAppFlowStatusLocaleKeys.blocked,
  [FlowStatusEnum.THROTTLED]: whatsAppFlowStatusLocaleKeys.throttled,
};

export const flowStatusBadgeMap: Record<FlowStatusEnum, FlowStatusBadgeType> = {
  [FlowStatusEnum.PUBLISHED]: 'success',
  [FlowStatusEnum.DRAFT]: 'warning',
  [FlowStatusEnum.DEPRECATED]: 'default',
  [FlowStatusEnum.BLOCKED]: 'error',
  [FlowStatusEnum.THROTTLED]: 'processing',
};
