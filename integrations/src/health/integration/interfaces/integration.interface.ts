import { EntityType } from '../../interfaces/entity.interface';
import { IntegrationType } from '../../interfaces/integration-types';

interface IIntegration {
  name: string;
  codeIntegration: string;
  type: IntegrationType;
  entitiesToSync?: EntityType[];
  entitiesFlow?: EntityType[];
  showExternalEntities?: EntityType[];
  steps?: EntityType[];
  workspaceId: string;
  syncStatus?: number;
  enabled: boolean;
  lastSyncErrorTimestamp?: number;
  lastSyncEntities?: number;
  lastSyncTimestamp?: number;
  rules?: { [key in IntegrationRules]?: any };
  environment: IntegrationEnvironment;
  syncType?: IntegrationSyncType;
  debug?: boolean;
  routines?: Routines;
  scheduling?: Scheduling;
  scheduleNotification?: ScheduleNotification;
  auditRequests?: boolean;
  messages?: { [key in IntegrationMessages]?: any };
  recoverAccessProtocol?: RecoverAccessProtocol;
  documents?: {
    enableDocumentsUpload?: boolean;
    documentsMaxSizeInMb?: number;
  };
}

interface Routines {
  cronSearchAvailableSchedules?: boolean;
}

interface ScheduleNotification {
  // Envia notificação para agendamentos criados dentro da plataforma como uma nova mensagem e não imediatamente
  // logo após agendamento como a regra `scheduling.createSchedulingLinkAfterCreateSchedule`
  createInternalNotificationAfterCreateSchedule: boolean;
  // Ativa a regra de envio de notificação seja importando via ERP
  createNotificationsFromImport: boolean;
  // envia uma notificação para cada agendamento, ao invés de agrupado em 2h (que é o modo padrão de envio)
  sendInternalNotificationForEachSchedule: boolean;
}

interface Scheduling {
  identifier: string;
  guidanceFormatType: SchedulingGuidanceFormat;
  // Se a regra estiver ativa, salva os agendamentos criadas pela nossa integração e envia notificação imediatamente após criar agendamento
  createSchedulingLinkAfterCreateSchedule: boolean;
  config?: {
    name?: string;
    friendlyName?: string;
    logo?: string;
    whatsapp?: {
      phoneNumber?: string;
      startSchedulingMessage?: string;
      startReschedulingMessage?: string;
    };
    resources?: {
      cancellation?: {
        enableScheduleCancellation?: boolean;
        hoursBeforeAppointmentToAllowCancellation?: number;
      };
      confirmation?: {
        enableScheduleConfirmation?: boolean;
        hoursBeforeAppointmentToAllowConfirmation?: number;
      };
      rescheduling?: {
        enableScheduleRescheduling?: boolean;
        hoursBeforeAppointmentToAllowRescheduling?: number;
      };
    };
    // Habilita para upload do paciente na tela de agendamento online
    documents?: {
      enableDocumentsUpload?: boolean;
      documentsMaxSizeInMb?: number;
      suporteMessage?: string;
    };
  };
}

export interface RecoverAccessProtocol {
  enabled?: boolean;
  steps?: RecoverAccessProtocolSteps[];
  validateAllSteps?: boolean;
}

export enum RecoverAccessProtocolSteps {
  email = 'email',
  zipcode = 'zipcode',
  insuranceNumber = 'insuranceNumber',
}

enum SchedulingGuidanceFormat {
  file = 'file',
  rawText = 'rawText',
}

export enum IntegrationEnvironment {
  production = 'production',
  test = 'test',
}

export enum IntegrationSyncType {
  daily = 'daily',
  weekly = 'weekly',
}

export enum IntegrationPatientNameCase {
  UPPER = 'UPPER',
  LOWER = 'LOWER',
  CAPITALIZE = 'CAPITALIZE',
  NONE = 'NONE',
}

enum IntegrationMessages {
  confirmSchedule = 'confirmSchedule',
  avaliableScheduleInList = 'avaliableScheduleInList',
  procedureValueConfirmationStep = 'procedureValueConfirmationStep',
  confirmScheduleWithLinkButtonTitle = 'confirmScheduleWithLinkButtonTitle',
  stepMessages = 'stepMessages',
}

enum IntegrationRules {
  // lista apenas médicos que contém horários
  listOnlyDoctorsWithAvailableSchedules = 'listOnlyDoctorsWithAvailableSchedules',
  // lista consultation type como procedure - CLINIC
  listConsultationTypesAsProcedure = 'listConsultationTypesAsProcedure',
  // envia tipo de serviço na criação do agendamento
  requiredTypeOfServiceOnCreateAppointment = 'requiredTypeOfServiceOnCreateAppointment',
  useProcedureWithoutSpecialityRelation = 'useProcedureWithoutSpecialityRelation',
  useProcedureAsInterAppointmentValidation = 'useProcedureAsInterAppointmentValidation',
  useOccupationAreaAsInterAppointmentValidation = 'useOccupationAreaAsInterAppointmentValidation',
  useDoctorAsInterAppointmentValidation = 'useDoctorAsInterAppointmentValidation',
  // utiliza um código composto com várias entidades no procedimento
  useProcedureWithCompositeCode = 'useProcedureWithCompositeCode',
  // envia observações do procedimento para o paciente na confirmacão do agendamento
  sendObservationOnListSchedules = 'sendObservationOnListSchedules',
  // envia orientações do procedimento para o paciente através da rota criar agendamento
  sendGuidanceOnCreateSchedule = 'sendGuidanceOnCreateSchedule',
  // tuotempo concatena planos no convenio em algumas integrações. Nesta regra é utilizado o campo
  // legacyid para realizar a divisão dos planos
  splitInsuranceIntoInsurancePlans = 'splitInsuranceIntoInsurancePlans',
  // tuotempo concatena planos no convenio em algumas integrações. Nesta regra é utilizado o campo
  // tags para realizar a divisão dos planos
  splitInsuranceIntoInsurancePlansV2 = 'splitInsuranceIntoInsurancePlansV2',
  // se um dos updatePatient* estiver ativo realiza um update no paciente antes de criar o agendamento
  updatePatientEmailBeforeCreateSchedule = 'updatePatientEmailBeforeCreateSchedule',
  updatePatientSexBeforeCreateSchedule = 'updatePatientSexBeforeCreateSchedule',
  updatePatientPhoneBeforeCreateSchedule = 'updatePatientPhoneBeforeCreateSchedule',
  usesCorrelation = 'usesCorrelation',
  showFutureSearchInAvailableScheduleList = 'showFutureSearchInAvailableScheduleList',
  // tempo que a confirmação pode ser realizada antes da data do agendamento
  timeBeforeTheAppointmentThatConfirmationCanBeMade = 'timeBeforeTheAppointmentThatConfirmationCanBeMade',
  showListingFutureTimesFrom = 'showListingFutureTimesFrom',
  runFirstScheduleRule = 'runFirstScheduleRule',
  // @Description: Guarda tempo que o registro ficará no cache
  // @Explanation: Cria uma chave no redis com uma conbinação de filtros salvando o primeiro horario disponivel retornado
  // e utiliza nas próximas requisições até o tempo definido em cache expirar
  timeCacheFirstAppointmentAvailableForFutureSearches = 'timeCacheFirstAppointmentAvailableForFutureSearches',
  // tempo limite para busca de horários, em qualquer caso o valor definido será o limite para buscas
  limitUntilDaySearchAppointments = 'limitUntilDaySearchAppointments',
  // se ao gravar agendamento ocorreu um conflito, pega esse horário e não exibe mais como uma
  // possibilidade de retorno na listagem de horários disponiveis
  timeToIgnoreConflictingSchedules = 'timeToIgnoreConflictingSchedules',
  limitUntilDaySearchAppointmentsWithDoctor = 'limitUntilDaySearchAppointmentsWithDoctor',
  // se ativo executa a regra de interconsulta na listagem de horários disponíveis
  runInterAppointment = 'runInterAppointment',
  // limite de dias na listagem de médicos a partir dos horários
  limitDaysForListDoctorsWithAvailableSchedules = 'limitDaysForListDoctorsWithAvailableSchedules',
  // mesma coisa que o fromDay, porém em minutos
  timeFirstAvailableSchedule = 'timeFirstAvailableSchedule',
  // exibe a opção de escolher outro médico na listagem de horários disponiveis
  showAnotherDoctorInTheListOfAvailableAppointments = 'showAnotherDoctorInTheListOfAvailableAppointments',
  listAvailableAppointmentFromAllActiveUnits = 'listAvailableAppointmentFromAllActiveUnits',
  // se ativo exibe nova opção de horário noturno na seleção de período do dia
  usesNightTimeInTheSelectionOfPeriod = 'usesNightTimeInTheSelectionOfPeriod',
  // utiliza para a busca de horários. Se o periodo de busca for 30 e aqui tiver o valor 7, realiza 4 requests pararelas
  limitOfDaysToSplitRequestInScheduleSearch = 'limitOfDaysToSplitRequestInScheduleSearch',
  // Se a regra estiver ativa não permite que paciente agende para um dia se já tiver outro
  doNotAllowSameDayScheduling = 'doNotAllowSameDayScheduling',
  // Se a regra estiver ativa não permite que paciente agende para o mesmo dia e mesmo médico se já tiver outro
  doNotAllowSameDayAndDoctorScheduling = 'doNotAllowSameDayAndDoctorScheduling',
  // Se a regra estiver ativa não permite que paciente agende para o mesmo dia e mesmo procedimento se já tiver outro
  doNotAllowSameDayAndProcedureScheduling = 'doNotAllowSameDayAndProcedureScheduling',
  // Se a regra estiver ativa não permite que paciente agende para o mesmo horário outro agendamento.
  doNotAllowSameHourScheduling = 'doNotAllowSameHourScheduling',
  // Se a regra doNotAllowSameHourScheduling estiver ativa, agenda à partir do tempo em minutos definido
  minutesAfterAppointmentCanSchedule = 'minutesAfterAppointmentCanSchedule',
  // ativação de steps de _suggestion
  useInsuranceSuggestion = 'useInsuranceSuggestion',
  useDoctorSuggestion = 'useDoctorSuggestion',
  // filtro alternativo Clinux
  useClinuxApiV2 = 'useClinuxApiV2',
  useScheduledSending = 'useScheduledSending',
  doNotCancelBefore24hours = 'doNotCancelBefore24hours',
  useNetpacsGroupedSchedules = 'useNetpacsGroupedSchedules',
  useNetpacsDoctorByProcedure = 'useNetpacsDoctorByProcedure',
  // Usar rota Feegow para filtrar médicos por convênio
  useFeegowFilterDoctorsByInsurance = 'useFeegowFilterDoctorsByInsurance',
  getPatientDoctorAttended = 'getPatientDoctorAttended',
  patientNameCase = 'patientNameCase',
  // Permite que seja renderizado um comando #voltar no fluxo do agendamento
  allowStepBack = 'allowStepBack',
  // Quando ativo envia todos os itens para seleção do paciente em formato de lista
  useListInAllSteps = 'useListInAllSteps',
  useReportProcessorAISpecialityAndProcedureDetection = 'useReportProcessorAISpecialityAndProcedureDetection',
  useReportProcessorAIProcedureDetection = 'useReportProcessorAIProcedureDetection',
}

export type { IIntegration, Routines, Scheduling };
export { IntegrationRules, IntegrationMessages, SchedulingGuidanceFormat };
