import { Types } from 'mongoose';
import { AppointmentSortMethod } from '../../interfaces/appointment.interface';

interface IFlow {
  organizationUnitId?: Types.ObjectId[];
  insuranceId?: Types.ObjectId[];
  insurancePlanId?: Types.ObjectId[];
  insuranceSubPlanId?: Types.ObjectId[];
  planCategoryId?: Types.ObjectId[];
  specialityId?: Types.ObjectId[];
  procedureId?: Types.ObjectId[];
  doctorId?: Types.ObjectId[];
  appointmentTypeId?: Types.ObjectId[];
  occupationAreaId?: Types.ObjectId[];
  typeOfServiceId?: Types.ObjectId[];
  organizationUnitLocationId?: Types.ObjectId[];
  reasonId?: Types.ObjectId[];
  integrationId: string;
  actions?: FlowAction[];
  step?: FlowSteps[];
  type: FlowType;
  deletedAt?: number;
  createdAt?: number;
  publishedAt?: number;
  updatedByUserId?: string;
  updatedAt?: number;
  inactive?: boolean;
  maximumAge?: number;
  minimumAge?: number;
  periodOfDay?: FlowPeriodOfDay;
  patientSex?: string;
  cpfs?: string[];
  description?: string;
  executeFrom?: number;
  executeUntil?: number;
  runBetweenStart?: number;
  runBetweenEnd?: number;
  trigger?: FlowTriggerType[];
  _id: string;
}

interface IApiFlow extends Omit<IFlow, 'deletedAt'> {
  deletedAt?: string;
}

enum FlowPeriodOfDay {
  morning = 0,
  afternoon = 1,
  indifferent = 2,
  night = 3,
}

enum FlowSteps {
  organizationUnit = 'organizationUnit',
  speciality = 'speciality',
  insurance = 'insurance',
  insurancePlan = 'insurancePlan',
  procedure = 'procedure',
  doctor = 'doctor',
  appointmentType = 'appointmentType',
  planCategory = 'planCategory',
  insuranceSubPlan = 'insuranceSubPlan',
  group = 'group',
  occupationArea = 'occupationArea',
  organizationUnitLocation = 'organizationUnitLocation',
  listAppointments = 'listAppointments',
  doAppointment = 'doAppointment',
  choose_doctor = 'choose_doctor',
  choose_day_period = 'choose_day_period',
  listPatientSchedules = 'listPatientSchedules',
  confirmAppointment = 'confirmAppointment',
  cancel = 'cancel',
  confirmPresence = 'confirmPresence',
  reschedule = 'reschedule',
  typeOfService = 'typeOfService',
  confirmActive = 'confirmActive',
  reason = 'reason',
  confirmPassive = 'confirmPassive',
  appointmentValue = 'appointmentValue',
}

enum FlowTriggerType {
  before_end_conversation = 'before_end_conversation',
  active_confirmation_confirm = 'active_confirmation_confirm',
  active_confirmation_cancel = 'active_confirmation_cancel',
}

enum FlowActionType {
  tag = 'tag',
  postback = 'postback',
  attribute = 'attribute',
  goto = 'goto',
  text = 'text',
  rules = 'rules',
  rulesConfirmation = 'rulesConfirmation',
}

enum FlowType {
  omit = 'omit',
  action = 'action',
  correlation = 'correlation',
  includeOnly = 'includeOnly',
}

interface FlowActionTag {
  action: 'remove' | 'add' | 'remove-all';
  color: string;
  name: string;
}

interface FlowActionPostback {
  value: string;
}

interface FlowActionAttribute {
  action: 'add' | 'remove';
  label?: string;
  name?: string;
  type?: string;
  value: any;
  botId: string;
}

interface FlowActionGoTo {
  workspaceId?: string;
  botId?: string;
  value: string;
}

interface FlowActionText {
  text: string;
}

interface FlowActionRules {
  price?: string;
  address?: string;
  skipIfOneItem?: boolean;
  skipIfNoItems?: boolean;
  limit?: number;
  randomize?: boolean;
  untilDay?: number;
  sortMethod?: AppointmentSortMethod;
  canNotCancel?: boolean;
  canNotConfirmActive?: boolean;
  canNotConfirmPassive?: boolean;
  canNotView?: boolean;
  canNotReschedule?: boolean;
  priority?: number;
  guidanceBeforeScheduled?: string;
  guidanceAfterScheduled?: string;
  fromDay?: number;
  skipSelection?: boolean;
  ifEmptyDataGoto?: string;
  noAvailableDatesMessage?: string;
  canReturnStep?: boolean;
}

interface FlowActionConfirmationRules {
  cancelGoto?: string;
  confirmationGoto?: string;
  confirmationAssignToTeam?: string;
  cancelGotoAssignToTeam?: string;
  cancelMessage?: string;
  confirmationMessage?: string;
  priority?: number;
  onErrorGoto?: string;
  rescheduleGoto?: string;
  askReschedule?: boolean;
  cancelOnReschedule?: boolean;
  sendGuidanceOnConfirmSchedule?: boolean;
  notActionGoto?: string;
  guidance?: string;
}

type FlowActionElement =
  | FlowActionTag
  | FlowActionAttribute
  | FlowActionPostback
  | FlowActionGoTo
  | FlowActionText
  | FlowActionRules
  | FlowActionConfirmationRules;

interface FlowAction<T = FlowActionElement> {
  type: FlowActionType;
  element: T;
}

interface IFlowActionType<T> {
  type: FlowActionType;
  element: T;
}

export {
  FlowAction,
  FlowActionAttribute,
  FlowActionPostback,
  FlowActionTag,
  IFlow,
  FlowActionType,
  FlowType,
  FlowActionElement,
  FlowSteps,
  IApiFlow,
  FlowPeriodOfDay,
  FlowActionRules,
  IFlowActionType,
  FlowTriggerType,
  FlowActionConfirmationRules,
};
