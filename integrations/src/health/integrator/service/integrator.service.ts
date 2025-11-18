import { HttpStatus, Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import * as fuzzy from 'fast-fuzzy';
import * as crypto from 'crypto';
import * as Sentry from '@sentry/node';
import {
  FindDoctorParams,
  FindDoctorResponse,
  ListDoctorSchedulesParams,
  ListDoctorSchedulesResponse,
  RecoverAccessProtocol,
  RecoverAccessProtocolResponse,
} from 'kissbot-health-core';
import { orderBy, uniq } from 'lodash';
import * as moment from 'moment';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../common/exceptions.service';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import {
  botCancelRequestCounter,
  botCancelRequestDoneCounter,
  botCancelRequestErrorCounter,
  botConfirmRequestCounter,
  botConfirmRequestDoneCounter,
  botConfirmRequestErrorCounter,
  confirmationCancelCounter,
  confirmationCancelErrorCounter,
  confirmationCancelSuccessCounter,
  confirmationConfirmCounter,
  confirmationConfirmErrorCounter,
  confirmationConfirmSuccessCounter,
  createdSchedulesCounter,
  entityListRequestCounter,
} from '../../../common/prom-metrics';
import { CacheService } from '../../../core/cache/cache.service';
import { IExternalEntity } from '../../api/interfaces/entity.interface';
import { EntitiesSuggestionService } from '../../entities-suggestions/entitites-suggestion.service';
import {
  AppointmentTypeEntityDocument,
  DoctorEntityDocument,
  EntityDocument,
  InsuranceEntityDocument,
  ScheduleType,
  TypeOfService,
  TypeOfServiceEntityDocument,
} from '../../entities/schema';
import { EntitiesService } from '../../entities/services/entities.service';
import { FlowAction, FlowActionRules, FlowActionType, FlowSteps } from '../../flow/interfaces/flow.interface';
import { MatchFlowActions } from '../../flow/interfaces/match-flow-actions';
import { FlowService } from '../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationService } from '../../integration/integration.service';
import { IntegrationEnvironment } from '../../integration/interfaces/integration.interface';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { AmigoService } from '../../integrations/amigo-integration/services/amigo.service';
import { BotdesignerService } from '../../integrations/botdesigner-integration/services/botdesigner.service';
import { ClinicService } from '../../integrations/clinic-integration/services/clinic.service';
import { ClinuxService } from '../../integrations/clinux-integration/services/clinux.service';
import { CmService } from '../../integrations/cm-integration/services/cm.service';
import { CustomImportService } from '../../integrations/custom-import-integration/custom-import.service';
import { DoctoraliaService } from '../../integrations/doctoralia-integration/services/doctoralia.service';
import { DrMobileService } from '../../integrations/dr-mobile-integration/services/dr-mobile.service';
import { FeegowService } from '../../integrations/feegow-integration/services/feegow.service';
import { ManagerService } from '../../integrations/manager-integration/services/manager.service';
import { MatrixService } from '../../integrations/matrix-integration/services/matrix.service';
import { NetpacsService } from '../../integrations/netpacs-integration/services/netpacs.service';
import { SaoMarcosService } from '../../integrations/sao-marcos-integration/services/sao-marcos.service';
import { SuporteInformaticaService } from '../../integrations/suporte-informatica-integration/services/suporte-informatica.service';
import { TdsaService } from '../../integrations/tdsa-integration/services/tdsa.service';
import {
  Appointment,
  AppointmentValue,
  FollowUpAppointment,
  MinifiedAppointments,
} from '../../interfaces/appointment.interface';
import { ConfirmationSchedule, ConfirmationScheduleDataV2 } from '../../interfaces/confirmation-schedule.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../interfaces/correlation-filter.interface';
import { EntityType, EntityTypes, SpecialityTypes } from '../../interfaces/entity.interface';
import { IntegrationType } from '../../interfaces/integration-types';
import { OnDutyMedicalScale } from '../../interfaces/on-duty-medical-scale.interface';
import { Patient } from '../../interfaces/patient.interface';
import { PatientDataService } from '../../patient-data/patient-data.service';
import { RulesHandlerService } from '../../rules-handler/rules-handler.service';
import { getDefaultPatientAppointmentFlow } from '../../shared/default-flow-appointment';
import { EntitiesFiltersService } from '../../shared/entities-filters.service';
import {
  CancelSchedule,
  CancelScheduleV2,
  ConfirmSchedule,
  ConfirmScheduleV2,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  CreatePatient,
  CreateSchedule,
  DownloadDocumentData,
  EntitiesFromInsurance,
  EntityList,
  EntityListResponse,
  EntityListText,
  EntityListTextResponse,
  GetScheduleValue,
  IIntegratorService,
  ListAvailableMedicalReports,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
  ListPatientSuggestedData,
  ListReasons,
  ListSchedulesToConfirm,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  MatchFlowsFromFilters,
  PatientFilters,
  PatientFollowUpSchedules,
  PatientSchedules,
  PatientSuggestedInsurances,
  Reschedule,
  UpdatePatient,
  ValidPatientReportDownloadRequest,
  ValidateScheduleConfirmation,
  CountAvailableMedicalReportsResponse,
  ListAvailableMedicalReportsFilterRequest,
  ListAvailableMedicalReportsTokenData,
  EntityFilter,
  HasAvailableMedicalReportsFilterRequest,
  HasAvailableMedicalReportsFilterResponse,
  PatientSuggestedDoctors,
  ListAvailableMedicalReportsByPatientCode,
  AgentUploadFile,
  PatientUploadFile,
  DocumentUploadFileType,
  ExtractType,
} from '../interfaces';
import { PreloadPatientData } from '../interfaces/preload-patient-data.interface';
import { IntegratorValidatorsService } from '../validators/integrator-validators.service';
import { IntegratorTriggersService, TriggerType } from './integrator-triggers.service';
import { GetScheduleByIdData } from '../interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../schedules/entities/schedules.entity';
import { ValidatePatientRecoverAccessProtocol } from '../../integrations/matrix-integration/interfaces/recover-password.interface';
import { KayserService } from '../../integrations/kayser-integration/services/kayser.service';
import { SchedulingLinksService } from '../../scheduling/services/scheduling-links.service';
import { isHomologChannel } from '../../../common/helpers/homolog-channel';
import * as contextService from 'request-context';
import { CtxMetadata } from '../../../common/interfaces/ctx-metadata';
import { DownloadMedicalReportTokenData } from '../../scheduling/interfaces/download-token.interface';
import { castObjectId, castObjectIdToString } from '../../../common/helpers/cast-objectid';
import { ListSchedules } from '../../scheduling/interfaces/list-schedules.interface';
import { ListSuggestedDoctors } from '../interfaces/list-suggested-doctors.interface';
import { patientNameCaseFormat } from '../../../common/helpers/patient-name-case';
import { formatCurrency } from '../../../common/helpers/format-currency';
import { AgentDeleteFile } from '../interfaces/documents/agent-delete-file.interface';
import { PatientDeleteFile } from '../interfaces/documents/patient-delete-file.interface';
import { Types } from 'mongoose';
import { ReportProcessorService } from '../../report-processor/services/report-processor.service';
import { ExtractedSchedule } from '../../schedules/interfaces/extracted-schedule.interface';
import { SchedulingLinks } from '../../scheduling/entities/scheduling-links.entity';

@Injectable()
export class IntegratorService {
  private readonly logger = new Logger(IntegratorService.name);

  constructor(
    private moduleRef: ModuleRef,
    private validatorsService: IntegratorValidatorsService,
    private readonly integrationService: IntegrationService,
    private readonly flowService: FlowService,
    private readonly entitiesService: EntitiesService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly integratorTriggersService: IntegratorTriggersService,
    private readonly cacheService: CacheService,
    private readonly patientDataService: PatientDataService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly rulesHandlerService: RulesHandlerService,
    private readonly entitiesSuggestionService: EntitiesSuggestionService,
    private readonly schedulingLinksService: SchedulingLinksService,
    private readonly reportProcessorService: ReportProcessorService,
  ) {}

  async getIntegration(integrationId: string): Promise<{
    service: IIntegratorService;
    integration: IntegrationDocument;
  }> {
    if (!integrationId) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'Invalid integration', undefined, true);
    }

    const integration = await this.integrationService.getOne(integrationId);

    if (!integration) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'Inexistent integration', undefined, true);
    }

    if (!integration.enabled) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, 'Disabled integration', undefined, true);
    }

    switch (integration?.type) {
      case IntegrationType.CM:
        return {
          service: this.moduleRef.get<CmService>(CmService, { strict: false }),
          integration,
        };

      case IntegrationType.DOCTORALIA:
        return {
          service: this.moduleRef.get<DoctoraliaService>(DoctoraliaService, { strict: false }),
          integration,
        };

      case IntegrationType.NETPACS:
        return {
          service: this.moduleRef.get<NetpacsService>(NetpacsService, { strict: false }),
          integration,
        };

      case IntegrationType.TDSA:
        return {
          service: this.moduleRef.get<TdsaService>(TdsaService, { strict: false }),
          integration,
        };

      case IntegrationType.FEEGOW:
        return {
          service: this.moduleRef.get<FeegowService>(FeegowService, { strict: false }),
          integration,
        };

      case IntegrationType.SAO_MARCOS:
        return {
          service: this.moduleRef.get<SaoMarcosService>(SaoMarcosService, { strict: false }),
          integration,
        };

      case IntegrationType.CLINUX:
        return {
          service: this.moduleRef.get<ClinuxService>(ClinuxService, { strict: false }),
          integration,
        };

      case IntegrationType.SUPORTE_INFORMATICA:
        return {
          service: this.moduleRef.get<SuporteInformaticaService>(SuporteInformaticaService, { strict: false }),
          integration,
        };

      case IntegrationType.CUSTOM_IMPORT:
        return {
          service: this.moduleRef.get<CustomImportService>(CustomImportService, { strict: false }),
          integration,
        };

      case IntegrationType.MANAGER:
        return {
          service: this.moduleRef.get<ManagerService>(ManagerService, { strict: false }),
          integration,
        };

      case IntegrationType.BOTDESIGNER:
        return {
          service: this.moduleRef.get<BotdesignerService>(BotdesignerService, { strict: false }),
          integration,
        };

      case IntegrationType.DR_MOBILE:
        return {
          service: this.moduleRef.get<DrMobileService>(DrMobileService, { strict: false }),
          integration,
        };

      case IntegrationType.CLINIC:
        return {
          service: this.moduleRef.get<ClinicService>(ClinicService, { strict: false }),
          integration,
        };

      case IntegrationType.MATRIX:
        return {
          service: this.moduleRef.get<MatrixService>(MatrixService, { strict: false }),
          integration,
        };

      case IntegrationType.AMIGO:
        return {
          service: this.moduleRef.get<AmigoService>(AmigoService, { strict: false }),
          integration,
        };

      case IntegrationType.KAYSER:
        return {
          service: this.moduleRef.get<KayserService>(KayserService, { strict: false }),
          integration,
        };

      default:
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, 'Invalid integration');
    }
  }

  private async validateIntegration(integrationId: string): Promise<{
    service: IIntegratorService;
    integration: IntegrationDocument;
  }> {
    try {
      return await this.getIntegration(integrationId);
    } catch (error) {
      return INTERNAL_ERROR_THROWER('IntegratorService', error);
    }
  }

  async getPatient(integrationId: string, filters: PatientFilters, ignoreBornDateValidation = false): Promise<Patient> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const patient = await service?.getPatient(integration, filters);

    if (!patient) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
    }

    try {
      await this.integratorTriggersService.trigger(
        integration,
        service,
        TriggerType.createPatientWhenIdentifyingThem,
        patient,
      );
    } catch (error) {
      this.logger.error(error);
    }
    try {
      if (!patient?.bornDate) {
        return patient;
      } else if (
        !ignoreBornDateValidation &&
        moment.utc(patient.bornDate).startOf('day').valueOf() !== moment.utc(filters.bornDate).startOf('day').valueOf()
      ) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.FORBIDDEN,
          {
            message: 'Validation failed: bornDate',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
          true,
        );
      }

      return {
        ...patient,
        bornDate: moment.utc(patient.bornDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      };
    } catch (error) {
      throw error;
    }
  }

  async getPatientByCode(integrationId: string, filters: PatientFilters): Promise<Patient> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const patient = await service?.getPatient(integration, filters);

    if (!patient) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
    }

    try {
      await this.integratorTriggersService.trigger(
        integration,
        service,
        TriggerType.createPatientWhenIdentifyingThem,
        patient,
      );
    } catch (error) {
      this.logger.error(error);
    }

    try {
      return patient;
    } catch (error) {
      throw error;
    }
  }

  async createPatient(integrationId: string, createPatient: CreatePatient): Promise<Patient> {
    const { service, integration } = await this.validateIntegration(integrationId);

    try {
      const { patient } = createPatient;

      if (integration?.rules?.patientNameCase && patient.name) {
        patient.name = patientNameCaseFormat(integration, patient.name);
      }

      const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(
        integration,
        undefined,
        patient.cpf,
      );

      if (patientCache) {
        return patientCache;
      }
    } catch (error) {}

    const createdPatient = await service?.createPatient(integration, createPatient);

    try {
      await this.integratorTriggersService.trigger(
        integration,
        service,
        TriggerType.createPatientWhenIdentifyingThem,
        createdPatient,
      );
    } catch (error) {
      this.logger.error(error);
    }

    return createdPatient;
  }

  async updatePatient(integrationId: string, patientCode: string, patientData: UpdatePatient): Promise<Patient> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (integration?.rules?.patientNameCase && patientData.patient?.name) {
      patientData.patient.name = patientNameCaseFormat(integration, patientData.patient.name);
    }

    return await service?.updatePatient(integration, patientCode, patientData);
  }

  async getCorrelationFilter(
    integrationId: string,
    correlationFilterList: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    const { integration } = await this.validateIntegration(integrationId);
    return this.entitiesService.createCorrelationFilterData(correlationFilterList, 'code', integration._id);
  }

  async getAvailableSchedules(
    integrationId: string,
    availableSchedules: ListAvailableSchedules,
    // indica se está tentando buscar mais horários por ter retornando 0 na request atual
    isRetry?: boolean,
  ): Promise<ListAvailableSchedulesResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    // se o dateLimit é menor que o dia atual ignora o parametro para evitar que não tenha nenhum dia
    // de periodo para retornar horários
    if (moment(availableSchedules.dateLimit).startOf('day').valueOf() < moment().startOf('day').valueOf()) {
      availableSchedules.dateLimit = undefined;
    }

    availableSchedules = await this.rulesHandlerService.getParamsFromListAvailableSchedules(
      integration,
      availableSchedules,
    );

    let limitUntilDay: number = 180;

    // lógica para se existir limitUntilDaySearchAppointments e não foi selecionado um médico
    if (
      integration.rules?.limitUntilDaySearchAppointments > 0 &&
      !availableSchedules.filter?.doctor?.code &&
      integration.rules?.limitUntilDaySearchAppointments < limitUntilDay
    ) {
      limitUntilDay = integration.rules.limitUntilDaySearchAppointments;
      // lógica para se existir limitUntilDaySearchAppointmentsWithDoctor e foi selecionado um médico
    } else if (
      integration.rules?.limitUntilDaySearchAppointmentsWithDoctor > 0 &&
      !!availableSchedules.filter?.doctor?.code &&
      integration.rules?.limitUntilDaySearchAppointmentsWithDoctor < limitUntilDay
    ) {
      limitUntilDay = integration.rules.limitUntilDaySearchAppointmentsWithDoctor;
      // se não caiu em nenhum, utiliza limitUntilDaySearchAppointments como padrão se existir
    } else if (integration.rules?.limitUntilDaySearchAppointments > 0) {
      limitUntilDay = integration.rules.limitUntilDaySearchAppointments;
    }

    // Manager faz muitas requests de horário, pois o range de busca é 7 dias
    // então limito em código para não dar problema
    if (
      [IntegrationType.MANAGER].includes(integration.type) &&
      (integration.rules?.limitUntilDaySearchAppointments > 50 ||
        integration.rules?.limitUntilDaySearchAppointmentsWithDoctor > 50)
    ) {
      limitUntilDay = 50;
    }

    if (availableSchedules.untilDay > limitUntilDay) {
      availableSchedules.untilDay = limitUntilDay;
    }

    try {
      // se tiver cache da request, retorna
      // utilizado majoritariamente pela navegação de horários disponibinizada
      const data = await this.integrationCacheUtilsService.getAvailableSchedulesCache(integration, availableSchedules);
      if (data) {
        return data as ListAvailableSchedulesResponse;
      }
    } catch (error) {}

    let { schedules: validSchedules, metadata } = await service?.getAvailableSchedules(integration, availableSchedules);

    if (!metadata) {
      metadata = {};
    }

    // Integrações que não tem data inicial de busca, então não tem como fazer retry
    // com períodos diferentes
    const cantRetryIntegrations = [
      IntegrationType.SUPORTE_INFORMATICA,
      IntegrationType.DR_MOBILE,
      IntegrationType.MATRIX,
    ];

    if (
      validSchedules?.length === 0 &&
      !isRetry &&
      availableSchedules.untilDay < limitUntilDay &&
      !cantRetryIntegrations.includes(integration.type) &&
      availableSchedules.filter?.typeOfService?.params?.referenceTypeOfService !== TypeOfService.followUp
    ) {
      const fromDay = availableSchedules.fromDay + availableSchedules.untilDay;

      return await this.getAvailableSchedules(
        integrationId,
        {
          ...availableSchedules,
          fromDay,
        },
        true,
      );
    }

    if (validSchedules?.length) {
      const firstAppointmentAvailable = validSchedules[0].appointmentDate;
      await this.rulesHandlerService.setDataFromListAvailableSchedules(
        integration,
        availableSchedules,
        firstAppointmentAvailable,
      );
    }

    // @TODO: essa lógica deveria estar dentro de cada integração, pois pode ficar vazia esta lista
    // chega 10 horários aqui, e omite 9. No service tem uns 500, se omitir 400 ainda consegue buscar os 10 para retornar aqui
    const [schedules, executedFlows] = await this.flowService.matchAppointmentsFlows({
      integrationId: integration._id,
      entitiesFilter: availableSchedules.filter,
      appointments: validSchedules ?? [],
      targetEntity: FlowSteps.listAppointments,
      filters: {
        patientBornDate: availableSchedules.patient?.bornDate,
        periodOfDay: availableSchedules.periodOfDay,
        patientSex: availableSchedules.patient?.sex,
        patientCpf: availableSchedules.patient?.cpf,
      },
    });

    if (executedFlows) {
      metadata.executedFlows = executedFlows;
    }

    const processedSchedules = schedules.map((schedule) => {
      const isFollowUp =
        schedule.typeOfService?.params?.referenceTypeOfService === TypeOfService.followUp ||
        schedule.appointmentType?.params?.referenceScheduleType === ScheduleType.FollowUp ||
        schedule.procedure?.specialityType === SpecialityTypes.R;

      if (isFollowUp) {
        return {
          ...schedule,
          price: {
            value: formatCurrency(0, 2),
            currency: 'R$',
          },
        };
      }

      return schedule;
    });

    const response = {
      schedules: processedSchedules,
      metadata: {
        ...metadata,
        runInterAppointment: Boolean(integration.rules.runInterAppointment),
      },
    };

    try {
      // cria cache temporário para o usuário navegar pelos horários de forma mais rápida
      // é por usuário, então só afeta o próprio paciente
      if (response?.schedules?.length) {
        await this.integrationCacheUtilsService.setAvailableSchedulesCache(integration, availableSchedules, response);
      }
    } catch (error) {}

    return response;
  }

  async createSchedule(integrationId: string, schedule: CreateSchedule): Promise<Appointment> {
    const { service, integration } = await this.validateIntegration(integrationId);

    try {
      if (this.integratorTriggersService.haveTrigger(integration, TriggerType.updatePatientBeforeCreateSchedule)) {
        await this.integratorTriggersService.trigger(
          integration,
          service,
          TriggerType.updatePatientBeforeCreateSchedule,
          schedule.patient,
        );
      }
    } catch (error) {
      this.logger.error(error);
    }

    try {
      const result = await service?.createSchedule(integration, schedule);
      await this.integrationCacheUtilsService.removePatientSchedulesCache(integration, schedule.patient.code);

      try {
        if (!!result?.appointmentCode) {
          createdSchedulesCounter
            .labels(castObjectIdToString(integration._id), integration.name, integration.type)
            .inc();
        }
      } catch (error) {}

      try {
        const metadata: CtxMetadata = contextService.get('req:default-headers');
        const isHomolog = isHomologChannel(metadata.channelId);

        if (integration.scheduling?.createSchedulingLinkAfterCreateSchedule && result?.appointmentCode && !isHomolog) {
          const { patient } = schedule;

          const { scheduleResumeLink } =
            await this.schedulingLinksService.createSchedulingLinkGroupedByPatientErpCodeAndScheduleCode(integration, {
              integrationId: castObjectIdToString(integration._id),
              patientErpCode: patient.code,
              patientCpf: patient.cpf,
              scheduleCode: result.appointmentCode,
              link: `resume/${result.appointmentCode}`,
            });

          result.guidanceLink = scheduleResumeLink?.shortLink || null;
        }
      } catch (error) {
        console.error(error);
      }

      return result;
    } catch (error) {
      this.integrationCacheUtilsService.removeAvailableSchedulesCache(integration).then();
      throw error;
    }
  }

  async cancelScheduleV2(integrationId: string, cancelSchedule: CancelScheduleV2): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const metricLabels = [castObjectIdToString(integration._id), integration.name, integration.type];

    try {
      confirmationCancelCounter.labels(...metricLabels).inc();
    } catch (error) {}

    this.validatorsService.validateCancelScheduleV2(cancelSchedule);
    const result = await service?.confirmationCancelSchedule(integration, cancelSchedule);

    try {
      if (result?.ok) {
        confirmationCancelSuccessCounter.labels(...metricLabels).inc();
      } else {
        confirmationCancelErrorCounter.labels(...metricLabels).inc();
      }
    } catch (error) {}

    return result;
  }

  async cancelSchedule(integrationId: string, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const metricLabels = [castObjectIdToString(integration._id), integration.name, integration.type];

    botCancelRequestCounter.labels(...metricLabels).inc();
    const result = await service?.cancelSchedule(integration, cancelSchedule);

    if (result?.ok) {
      botCancelRequestDoneCounter.labels(...metricLabels).inc();

      if (cancelSchedule?.patientCode) {
        await this.integrationCacheUtilsService.removePatientSchedulesCache(integration, cancelSchedule.patientCode);
      }
    } else {
      botCancelRequestErrorCounter.labels(...metricLabels).inc();
    }

    return result;
  }

  async confirmScheduleV2(integrationId: string, confirmSchedule: ConfirmScheduleV2): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const metricLabels = [castObjectIdToString(integration._id), integration.name, integration.type];

    try {
      confirmationConfirmCounter.labels(...metricLabels).inc();
    } catch (error) {}

    this.validatorsService.validateConfirmScheduleV2(confirmSchedule);
    const result = await service?.confirmationConfirmSchedule(integration, confirmSchedule);

    try {
      if (result?.ok) {
        confirmationConfirmSuccessCounter.labels(...metricLabels).inc();
      } else {
        confirmationConfirmErrorCounter.labels(...metricLabels).inc();
      }
    } catch (error) {}

    return result;
  }

  async confirmSchedule(integrationId: string, confirmSchedule: ConfirmSchedule): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const minutes = integration.rules.timeBeforeTheAppointmentThatConfirmationCanBeMade;
    const metricLabels = [castObjectIdToString(integration._id), integration.name, integration.type];

    botConfirmRequestCounter.labels(...metricLabels).inc();

    if (minutes) {
      const scheduleDate = moment.utc(confirmSchedule.appointmentDate).subtract(minutes, 'minutes').valueOf();

      if (moment.utc().valueOf() < scheduleDate) {
        return { ok: true, message: `Fora do período estabelecido de confirmação. ${minutes} minutos` };
      }
    }

    const result = await service?.confirmSchedule(integration, confirmSchedule);

    if (result?.ok) {
      botConfirmRequestDoneCounter.labels(...metricLabels).inc();
    } else {
      botConfirmRequestErrorCounter.labels(...metricLabels).inc();
    }

    return result;
  }

  async getScheduleValue(integrationId: string, scheduleValue: GetScheduleValue): Promise<AppointmentValue> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const { insurance, typeOfService, appointmentType, procedure } = scheduleValue;

    const insuranceDocument: InsuranceEntityDocument = await this.entitiesService.getEntityByCode(
      insurance.code,
      EntityType.insurance,
      integration._id,
    );

    if (!insuranceDocument?.params?.showAppointmentValue) {
      return HTTP_ERROR_THROWER(
        HttpStatus.UNAUTHORIZED,
        {
          message: 'Cannot return appointmentValue params.showAppointmentValue is disabled',
        },
        HttpErrorOrigin.API_ERROR,
        true,
      );
    }

    if (typeOfService?.code) {
      const typeOfServiceDocument = (await this.entitiesService.getEntityByCode(
        typeOfService.code,
        EntityType.typeOfService,
        integration._id,
      )) as TypeOfServiceEntityDocument;

      if (typeOfServiceDocument?.params?.referenceTypeOfService === TypeOfService.followUp) {
        return {
          value: formatCurrency(0, 2),
          currency: 'R$',
        };
      }
    } else if (appointmentType?.code) {
      const appointmentTypeDocument = (await this.entitiesService.getEntityByCode(
        appointmentType.code,
        EntityType.appointmentType,
        integration._id,
      )) as AppointmentTypeEntityDocument;

      if (appointmentTypeDocument?.params?.referenceScheduleType === ScheduleType.FollowUp) {
        return {
          value: formatCurrency(0, 2),
          currency: 'R$',
        };
      }
    } else if (procedure?.specialityType === SpecialityTypes.R) {
      return {
        value: formatCurrency(0, 2),
        currency: 'R$',
      };
    }

    return await service?.getScheduleValue(integration, scheduleValue);
  }

  async getPatientSchedules(integrationId: string, patientSchedules: PatientSchedules): Promise<Appointment[]> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const schedules = await service?.getPatientSchedules(integration, patientSchedules);

    if (patientSchedules?.ignoreFlowExecution) {
      return orderBy(schedules || [], 'appointmentDate', 'asc');
    }

    const schedulesWithActions = await Promise.all(
      schedules.map(async (appointment) => {
        const flowSteps = [FlowSteps.listPatientSchedules];

        if (patientSchedules.target) {
          flowSteps.push(patientSchedules.target);
        }

        const flowAction = getDefaultPatientAppointmentFlow(appointment, integration);
        const matchFlows: MatchFlowActions = {
          integrationId: integration._id,
          targetFlowTypes: flowSteps,
          entitiesFilter: {
            appointmentType: appointment.appointmentType,
            doctor: appointment.doctor,
            insurance: appointment.insurance,
            insurancePlan: appointment.insurancePlan,
            insuranceSubPlan: appointment.insuranceSubPlan,
            organizationUnit: appointment.organizationUnit,
            planCategory: appointment.planCategory,
            procedure: appointment.procedure,
            speciality: appointment.speciality,
          },
        };

        if (flowAction) {
          matchFlows.customFlowActions = [flowAction];
        }

        const flowActions = await this.flowService.matchFlowsAndGetActions(matchFlows);

        delete appointment.canCancel;
        delete appointment.canConfirm;
        delete appointment.canReschedule;

        return {
          ...appointment,
          actions: flowActions,
        };
      }),
    );

    return orderBy(schedulesWithActions || [], 'appointmentDate', 'asc');
  }

  async getPatientFollowUpSchedules(
    integrationId: string,
    patientSchedules: PatientFollowUpSchedules,
  ): Promise<FollowUpAppointment[]> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.getPatientFollowUpSchedules) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.getPatientFollowUpSchedules: Not implemented',
        undefined,
        true,
      );
    }

    return await service?.getPatientFollowUpSchedules(integration, patientSchedules);
  }

  async getMinifiedPatientSchedules(
    integrationId: string,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const response = await service?.getMinifiedPatientSchedules(integration, patientSchedules);

    if (response?.appointmentList?.length) {
      response.appointmentList = orderBy(response.appointmentList || [], 'appointmentDate', 'asc');
    }

    return response;
  }

  async getMultipleEntitiesByFilter(integrationId: string, filter: CorrelationFilterByKey): Promise<CorrelationFilter> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const correlation = await service?.getMultipleEntitiesByFilter(integration, filter);

    if (!correlation || !Object.keys(correlation).length) {
      return correlation;
    }

    if (integration.type === IntegrationType.CM) {
      const appointmentType = correlation?.appointmentType?.code;
      const procedureType = correlation?.procedure?.specialityType;
      const specialityType = correlation?.speciality?.specialityType;

      const procedureEqualsToAppointmentType =
        (appointmentType === SpecialityTypes.C && procedureType === SpecialityTypes.E) ||
        (appointmentType === SpecialityTypes.E && procedureType === SpecialityTypes.C);

      const specialityEqualsToAppointmentType =
        (appointmentType === SpecialityTypes.C && specialityType === SpecialityTypes.E) ||
        (appointmentType === SpecialityTypes.E && specialityType === SpecialityTypes.C);

      if (specialityEqualsToAppointmentType || procedureEqualsToAppointmentType) {
        correlation.speciality = undefined;
        correlation.procedure = undefined;
        correlation.doctor = undefined;
      }
    }

    return correlation;
  }

  async extractSingleEntity(integrationId: string, entityType: EntityType): Promise<EntityTypes[]> {
    const { service, integration } = await this.validateIntegration(integrationId);
    return await service?.extractSingleEntity(integration, entityType, undefined, false, true);
  }

  async extractAllEntities(integrationId: string): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.extractAllEntities) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.extractAllEntities: Not implemented',
        undefined,
        true,
      );
    }

    return await service?.extractAllEntities(integration);
  }

  async synchronizeEntities(integrationId: string, entityType?: EntityType): Promise<OkResponse> {
    const { integration } = await this.validateIntegration(integrationId);
    const client = this.cacheService.getClient('general');
    const cacheKeyPattern = `SYNC_ALL:${integrationId}`;
    const entitiesToSync = entityType ? [entityType] : integration.entitiesToSync;

    const syncData: { [entityType: string]: IExternalEntity[] } = {};

    for (const entityType of entitiesToSync) {
      const data = await client.get(`${cacheKeyPattern}:${entityType}`);

      let entities: IExternalEntity[] = [];

      try {
        entities = JSON.parse(data) as IExternalEntity[];
      } catch (error) {
        Sentry.captureEvent({
          message: `ERROR:INTEGRATOR:${integrationId}:synchronizeEntities`,
          extra: {
            integrationId: integrationId,
            error: error,
          },
        });

        continue;
      }

      if (entities?.length) {
        syncData[entityType] = entities;
      }

      const processedEntitiesKeyPattern = `${integration.type}:${castObjectIdToString(integration._id)}:processedEntities*`;
      await this.cacheService.removeKeysByPattern(processedEntitiesKeyPattern);
      await this.cacheService.removeKeysByPattern(`${cacheKeyPattern}:${entityType}`, undefined, 'general');
    }

    if (Object.keys(syncData).length) {
      await this.entitiesService.syncEntities(integration, syncData);
    }

    if (entityType === EntityType.procedure) {
      void this.reportProcessorService.importRagProcedures(integration).then();
    }

    return { ok: true };
  }

  async getEntityListByText(integrationId: string, entityListText: EntityListText): Promise<EntityListTextResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const { filter, targetEntity, patient, text, periodOfDay, dateLimit } = entityListText;

    const result: EntityListTextResponse = { isValid: false, data: [], executedFlows: null };

    if (service.getEntityListByText) {
      const { data, isValid } = await service?.getEntityListByText(integration, filter, targetEntity, text, patient);

      result.data = data;
      result.isValid = isValid;
    } else {
      const { data: validEntities } = await this.getEntityList(integrationId, {
        filter,
        patient,
        targetEntity,
        cache: true,
        dateLimit,
      });

      if (!validEntities?.length) {
        return result;
      }

      const uniqueEntityIds = validEntities.map((entity) => entity._id);
      const entities = await this.entitiesService.getEntitiesByTargetAndName(
        integration._id,
        targetEntity,
        [text],
        uniqueEntityIds as any,
      );

      const fuzzyEntities = fuzzy.search(text, validEntities, {
        keySelector: (obj) => obj.friendlyName,
        threshold: 0.85,
        useDamerau: true,
        normalizeWhitespace: true,
      });

      if (!entities?.length && !fuzzyEntities?.length) {
        return result;
      }

      const mergedEntities = [...(entities ?? []), ...(fuzzyEntities ?? [])].reduce((acc, entity) => {
        acc[castObjectIdToString(entity._id)] = entity;
        return acc;
      }, {});

      if (Object.keys(mergedEntities)?.length > 0) {
        result.isValid = true;
        result.data = Object.values(mergedEntities);
      }
    }

    const entitiesByReference = await this.entitiesFiltersService.filterEntitiesByReferences(
      integration,
      this.entitiesFiltersService.filterEntitiesByParams(integration, result.data, {
        bornDate: patient?.bornDate,
      }),
      targetEntity,
      filter,
    );

    const [entities, executedFlows] = await this.flowService.matchEntitiesFlows({
      integrationId: integration._id,
      targetEntity: targetEntity as unknown as FlowSteps,
      entitiesFilter: filter,
      entities: entitiesByReference,
      filters: {
        patientBornDate: patient?.bornDate,
        periodOfDay: periodOfDay,
        patientSex: patient?.sex,
        patientCpf: patient?.cpf,
      },
    });

    // sim, não compactuo com isso
    // @ticket 4598
    if (
      ['63a451945d631c00070cbcfb', '63e243217fcd9610cc7308cc'].includes(integrationId) &&
      entityListText.targetEntity === EntityType.doctor
    ) {
      const randomEntities = entities.sort(() => Math.random() - 0.5);
      return {
        ...result,
        data: orderBy(randomEntities, ['order'], ['desc']),
        executedFlows,
      };
    }

    return {
      ...result,
      data: orderBy(entities, ['order', 'friendlyName'], ['desc', 'asc']),
      executedFlows,
    };
  }

  async getEntityList(integrationId: string, entityList: EntityList): Promise<EntityListResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const { filter, targetEntity, patient, cache, periodOfDay, dateLimit } = entityList;

    const allStoredEntities = await service?.getEntityList(
      integration,
      filter,
      targetEntity,
      cache,
      patient,
      dateLimit,
    );

    try {
      entityListRequestCounter
        .labels(
          integration.name,
          integration.type,
          targetEntity,
          allStoredEntities?.length === 0 ? 'empty' : 'non_empty',
        )
        .inc();
    } catch (error) {}

    const entitiesByReference = await this.entitiesFiltersService.filterEntitiesByReferences(
      integration,
      this.entitiesFiltersService.filterEntitiesByParams(integration, allStoredEntities, {
        bornDate: patient?.bornDate,
      }),
      targetEntity,
      filter,
    );

    let externalEntities: EntityDocument[] = [];

    if (
      integration.showExternalEntities?.find((externalEntity) => externalEntity === targetEntity) &&
      ![IntegrationType.BOTDESIGNER].includes(integration.type)
    ) {
      const allExternalEntities = await service?.extractSingleEntity(integration, targetEntity, filter, true);
      const originalEntitiesCodes = new Set(entitiesByReference?.map((entity) => entity.code));

      externalEntities = allExternalEntities
        .filter((external) => !originalEntitiesCodes.has(external.code))
        .map(
          ({ name, friendlyName, ...item }) =>
            ({
              _id: new Types.ObjectId(),
              order: -1,
              friendlyName: friendlyName || name,
              activeErp: true,
              canCancel: true,
              canConfirmActive: true,
              canConfirmPassive: true,
              canReschedule: true,
              canSchedule: true,
              virtual: true,
              ...item,
            }) as EntityDocument & { virtual: boolean },
        );
    }

    const safeEntitiesByReference = entitiesByReference ?? [];
    const safeExternalEntities = externalEntities ?? [];

    const allCombinedEntities: EntityDocument[] = [...safeEntitiesByReference, ...safeExternalEntities];

    const [entitiesWithFlows, executedFlows] = await this.flowService.matchEntitiesFlows({
      integrationId: integration._id,
      entities: allCombinedEntities,
      targetEntity: targetEntity as unknown as FlowSteps,
      entitiesFilter: filter,
      filters: {
        patientBornDate: patient?.bornDate,
        periodOfDay: periodOfDay,
        patientSex: patient?.sex,
        patientCpf: patient?.cpf,
      },
    });

    // sim, não compactuo com isso
    // @ticket 4598
    if (
      ['63a451945d631c00070cbcfb', '63e243217fcd9610cc7308cc'].includes(integrationId) &&
      entityList.targetEntity === EntityType.doctor
    ) {
      const randomEntities = entitiesWithFlows.sort(() => Math.random() - 0.5);
      return {
        data: orderBy(randomEntities, ['order'], ['desc']),
        executedFlows,
      };
    }

    return {
      data: orderBy(entitiesWithFlows, ['order', 'friendlyName'], ['desc', 'asc']),
      executedFlows,
    };
  }

  async getEntityListV2(integrationId: string, entityFilter: EntityFilter): Promise<EntityListResponse> {
    const { filter, targetEntity, cache } = entityFilter;
    const { service, integration } = await this.validateIntegration(integrationId);
    const correlationFilterList: CorrelationFilterByKey = {
      appointmentType: filter?.appointmentTypeCode,
      doctor: filter?.doctorCode,
      insurance: filter?.insuranceCode,
      insurancePlan: filter?.insurancePlanCode,
      insuranceSubPlan: filter?.insuranceSubPlanCode,
      occupationArea: filter?.occupationAreaCode,
      organizationUnit: filter?.organizationUnitCode,
      organizationUnitLocation: filter?.organizationUnitLocationCode,
      planCategory: filter?.planCategoryCode,
      procedure: filter?.procedureCode,
      speciality: filter?.specialityCode,
      typeOfService: filter?.typeOfServiceCode,
    };

    const correlationFilter = await this.entitiesService.createCorrelationFilterData(
      correlationFilterList,
      'code',
      integration._id,
    );

    const entities = await service?.getEntityList(integration, correlationFilter, targetEntity, cache);

    return {
      data: orderBy(entities, ['order', 'friendlyName'], ['desc', 'asc']),
      executedFlows: null,
    };
  }

  async getEntityListCount(integrationId: string, entityList: EntityList): Promise<{ count: number }> {
    const { data: entities } = await this.getEntityList(integrationId, entityList);
    return { count: entities?.length ?? 0 };
  }

  async getStatus(integrationId: string): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);
    return await service?.getStatus(integration);
  }

  async getEntitiesFromInsurance(
    integrationId: string,
    entitiesFromInsurance: EntitiesFromInsurance,
  ): Promise<CorrelationFilter> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.getEntitiesFromInsurance) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.getEntitiesFromInsurance: Not implemented',
        undefined,
        true,
      );
    }

    const { filter = {}, insurance, patient } = entitiesFromInsurance;
    const data = await service?.getEntitiesFromInsurance(integration, insurance, patient.cpf);

    if (!data) {
      return null;
    }

    const newData: CorrelationFilter = {};
    let flowFilters = Object.keys(filter).length ? { ...filter, insurance } : { insurance };

    for (const entityType of Object.keys(data ?? {})) {
      if (
        [EntityType.insuranceSubPlan, EntityType.planCategory].includes(entityType as EntityType) &&
        data?.[EntityType.insurancePlan]
      ) {
        flowFilters[EntityType.insurancePlan] = data[EntityType.insurancePlan];
      }

      const [entities] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entitiesFilter: flowFilters,
        targetEntity: entityType as FlowSteps,
        filters: {
          patientBornDate: patient.bornDate,
          patientCpf: patient.cpf,
          patientSex: patient.sex,
        },
        entities: [data[entityType]],
      });

      newData[entityType] = entities[0];
    }

    return newData;
  }

  async matchFlowsFromFilters(integrationId: string, matchFlows: MatchFlowsFromFilters): Promise<FlowAction[]> {
    const { targetFlowType, filters, patientBornDate, periodOfDay, patientSex, patientCpf, trigger } = matchFlows;

    if (Object.values(FlowSteps).includes(targetFlowType)) {
      const result = await this.flowService.matchFlowsAndGetActions({
        integrationId: castObjectId(integrationId),
        entitiesFilter: filters,
        targetFlowTypes: [targetFlowType],
        filters: {
          patientBornDate,
          periodOfDay,
          patientSex,
          patientCpf,
        },
        trigger,
      });

      try {
        if (integrationId === '65ef68c8d89729446b4c0361') {
          return result?.map((flow) => {
            if (flow.type === FlowActionType.rules) {
              const element = flow.element as FlowActionRules;

              if (
                filters?.typeOfService?.params?.referenceTypeOfService === TypeOfService.followUp ||
                !filters?.insurance?.params?.showAppointmentValue
              ) {
                element.price = null;
              }
            }
            return flow;
          });
        }
      } catch (error) {
        this.logger.error('provida retorno', error);
      }

      return result;
    }

    throw new NotImplementedException();
  }

  async reschedule(integrationId: string, reschedule: Reschedule): Promise<Appointment> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const result = await service?.reschedule(integration, reschedule);

    try {
      if (reschedule?.patient.code) {
        await this.integrationCacheUtilsService.removePatientSchedulesCache(integration, reschedule.patient.code);
      }
    } catch (error) {}

    return result;
  }

  async clearCache(integrationId: string): Promise<OkResponse> {
    const { integration } = await this.validateIntegration(integrationId);

    try {
      const envKey = integration.environment === IntegrationEnvironment.test ? '-TEST' : '';
      const integrationKeyPattern = `${integration.type}${envKey}:${castObjectIdToString(integration._id)}:*`;
      await this.cacheService.removeKeysByPattern(integrationKeyPattern, ['api-token', 'patient-token']);
      return { ok: true };
    } catch (error) {
      return { ok: false };
    }
  }

  async listOnDutyMedicalScale(integrationId: string): Promise<OnDutyMedicalScale[]> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.listOnDutyMedicalScale) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.listOnDutyMedicalScale: Not implemented',
        undefined,
        true,
      );
    }

    return await service.listOnDutyMedicalScale(integration);
  }

  async listSchedulesToConfirm(
    integrationId: string,
    data: ListSchedulesToConfirm | ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (moment(data.startDate).startOf('day').valueOf() > moment(data.endDate).valueOf()) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, 'IntegratorService.listSchedulesToConfirm: Invalid endDate');
    }

    if (!service.listSchedulesToConfirm) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.listSchedulesToConfirm: Not implemented',
        undefined,
        true,
      );
    }

    const content = await service.listSchedulesToConfirm(integration, data);

    try {
      const schedulingLinks: Omit<SchedulingLinks, 'id'>[] = [];
      const extractType = (data as ListSchedulesToConfirmV2)?.erpParams?.EXTRACT_TYPE;

      // Para gerar um shortId sempre adicionar novos tipos aqui
      // Sempre que o canal precisar de um link deve ser tratado aqui a condição de envio
      if (
        extractType === ExtractType.documents_request ||
        (extractType === ExtractType.confirmation && data?.buildShortLink)
      ) {
        let pathToRedirect = 'resume';

        content.data = content.data?.map((data: ConfirmationScheduleDataV2) => {
          const { schedule, contact } = data;

          switch (extractType) {
            case ExtractType.documents_request:
              pathToRedirect = `documents/${schedule.scheduleCode}`;
              break;

            case ExtractType.confirmation:
              pathToRedirect = 'resume';
              break;

            default:
              pathToRedirect = 'resume';
          }

          const shortId = crypto
            .createHash('sha256')
            .update(`${contact.code}_${schedule.scheduleCode}_${extractType}`)
            .digest('hex')
            .substring(0, 10);

          schedulingLinks.push({
            integrationId,
            patientErpCode: contact.code,
            patientCpf: null,
            scheduleCode: schedule.scheduleCode,
            link: pathToRedirect,
            shortId,
            createdAt: moment().toDate(),
            expiration: moment().add(3, 'day').toISOString(),
          } as Omit<SchedulingLinks, 'id'>);

          const { shortLink, shortPathLink } = this.schedulingLinksService.buildSchedulingAccessLink(shortId);

          if (!data.schedule?.data) {
            data.schedule.data = {};
          }

          data.schedule.data = {
            ...data.schedule.data,
            shortId,
            PREPARO_URL: shortLink,
            URL_0: shortPathLink,
          };

          return data;
        });

        await this.schedulingLinksService.upsert(schedulingLinks);
      }
    } catch (error) {
      this.logger.error('Error while generating scheduling links for documents request', error);
    }

    return content;
  }

  async matchFlowsConfirmation(integrationId: string, data: MatchFlowsConfirmation): Promise<FlowAction[]> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.matchFlowsConfirmation) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.matchFlowsConfirmation: Not implemented',
        undefined,
        true,
      );
    }

    this.validatorsService.validateMatchFlowsConfirmation(data);
    return await service.matchFlowsConfirmation(integration, data);
  }

  async validateScheduleData(integrationId: string, data: ValidateScheduleConfirmation): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.validateScheduleData) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.validateScheduleData: Not implemented',
        undefined,
        true,
      );
    }

    this.validatorsService.validateValidateScheduleData(data);
    return await service.validateScheduleData(integration, data);
  }

  async listReasonsForNotScheduling(integrationId: string, data: ListReasons): Promise<EntityListResponse> {
    const { integration } = await this.validateIntegration(integrationId);
    const { filter } = data;

    const entities = await this.entitiesService.getActiveEntities(EntityType.reason, {}, integration._id);

    const [newEntities, executedFlows] = await this.flowService.matchEntitiesFlows({
      integrationId: integration._id,
      entitiesFilter: filter,
      targetEntity: data.targetEntity,
      filters: {},
      entities,
      forceTargetEntityToCompare: FlowSteps.reason,
    });

    return {
      data: newEntities,
      executedFlows,
    };
  }

  async getConfirmationScheduleGuidance(
    integrationId: string,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.getConfirmationScheduleGuidance) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.getConfirmationScheduleGuidance: Not implemented',
        undefined,
        true,
      );
    }

    this.validatorsService.validateGetConfirmationScheduleGuidance(data);

    if (data.scheduleCodes?.length) {
      data.scheduleCodes = uniq(data.scheduleCodes);
    }

    if (data.scheduleIds?.length) {
      data.scheduleIds = uniq(data.scheduleIds);
    }

    return await service.getConfirmationScheduleGuidance(integration, data);
  }

  async getConfirmationScheduleById(integrationId: string, data: GetScheduleByIdData): Promise<Schedules> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.getConfirmationScheduleById) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.getConfirmationScheduleById: Not implemented',
        undefined,
        true,
      );
    }

    return await service.getConfirmationScheduleById(integration, data);
  }

  async findDoctor(integrationId: string, data: FindDoctorParams): Promise<FindDoctorResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.findDoctor) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.findDoctor: Not implemented',
        undefined,
        true,
      );
    }

    return await service.findDoctor(integration, data);
  }

  async listDoctorSchedules(
    integrationId: string,
    data: ListDoctorSchedulesParams,
  ): Promise<ListDoctorSchedulesResponse[]> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.listDoctorSchedules) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.listDoctorSchedules: Not implemented',
        undefined,
        true,
      );
    }

    return await service.listDoctorSchedules(integration, data);
  }

  async preloadPatientData(integrationId: string, data: PreloadPatientData): Promise<void> {
    const { code, phone } = data;

    if (!phone && !code) {
      return;
    }

    const patient = await this.patientDataService.getPatientByCode(integrationId, {
      erpCode: code,
    });

    if (!patient) {
      return;
    }

    const { bornDate, erpCode } = patient;

    if (!erpCode) {
      return;
    }

    const formattedBornDate = moment.utc(Number(bornDate)).startOf('day').format('YYYY-MM-DD');

    Promise.all([
      this.getPatient(integrationId, {
        bornDate: formattedBornDate,
        code: erpCode,
        cpf: patient.cpf,
        phone,
      }),
      this.getMinifiedPatientSchedules(integrationId, {
        patientCode: erpCode,
        patientCpf: patient.cpf,
        patientBornDate: formattedBornDate,
        patientPhone: phone,
      }),
    ]).then();
  }

  async listPatientSuggestedInsurances(
    integrationId: string,
    data: ListPatientSuggestedData,
  ): Promise<PatientSuggestedInsurances> {
    const { service, integration } = await this.validateIntegration(integrationId);

    const entities = await service?.getEntityList(integration, data.filter, EntityType.insurance, true, null, null);
    const result = await this.entitiesSuggestionService.listSuggestedEntities(
      integration,
      data,
      EntityType.insurance,
      entities,
    );

    return result as PatientSuggestedInsurances;
  }

  async listPatientSuggestedDoctors(
    integrationId: string,
    data: ListPatientSuggestedData,
  ): Promise<PatientSuggestedDoctors> {
    const { service, integration } = await this.validateIntegration(integrationId);

    const entities = await service?.getEntityList(integration, data.filter, EntityType.doctor, true, null, null);
    const result = await this.entitiesSuggestionService.listSuggestedEntities(
      integration,
      data,
      EntityType.doctor,
      entities,
    );

    return result as PatientSuggestedDoctors;
  }

  async downloadDocument(integrationId: string, data: DownloadDocumentData): Promise<Buffer> {
    const { service, integration } = await this.validateIntegration(integrationId);
    return await service.downloadDocument(integration, data);
  }

  async downloadMedicalReport(integrationId: string, data: DownloadMedicalReportTokenData): Promise<Buffer> {
    const { service, integration } = await this.validateIntegration(integrationId);
    return await service.downloadMedicalReport(integration, data);
  }

  async getMedicalReportUrl(integrationId: string, data: DownloadMedicalReportTokenData): Promise<string> {
    const { service, integration } = await this.validateIntegration(integrationId);
    return await service.getMedicalReportUrl(integration, data);
  }

  async listAvailableMedicalReports(
    integrationId: string,
    data: ListAvailableMedicalReportsTokenData,
    filter: ListAvailableMedicalReportsFilterRequest,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReports>> {
    const { service, integration } = await this.validateIntegration(integrationId);
    return await service.listAvailableMedicalReports(integration, data, filter);
  }

  async listAvailableMedicalReportsByPatientCode(
    integrationId: string,
    data: ListAvailableMedicalReportsTokenData,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReportsByPatientCode>> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.validatePatientReportDownload) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.listAvailableMedicalReportsByPatientCode: Not implemented',
        undefined,
        true,
      );
    }

    return await service.listAvailableMedicalReportsByPatientCode(integration, data);
  }

  async hasAvailableMedicalReports(
    integrationId: string,
    data: ListSchedules,
    filter: HasAvailableMedicalReportsFilterRequest,
  ): Promise<HasAvailableMedicalReportsFilterResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.hasAvailableMedicalReports) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.hasAvailableMedicalReports: Not implemented',
        undefined,
        true,
      );
    }

    return await service.hasAvailableMedicalReports(integration, data, filter);
  }

  async validatePatientReportDownload(
    integrationId: string,
    body: ValidPatientReportDownloadRequest,
  ): Promise<boolean> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.validatePatientReportDownload) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.validatePatientReportDownload: Not implemented',
        undefined,
        true,
      );
    }

    return service.validatePatientReportDownload(integration, body);
  }

  async validateRecoverAccessProtocol(
    integrationId: string,
    data: ValidatePatientRecoverAccessProtocol,
  ): Promise<{ ok: boolean }> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.validateRecoverAccessProtocol) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.validateRecoverPassword: Not implemented',
        undefined,
        true,
      );
    }

    return await service.validateRecoverAccessProtocol(integration, data);
  }

  async recoverAccessProtocol(
    integrationId: string,
    data: RecoverAccessProtocol,
  ): Promise<RecoverAccessProtocolResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);
    const { name: methodName } = this.recoverAccessProtocol;

    if (!service.recoverAccessProtocol) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, `${methodName}: Not implemented`, undefined, true);
    }

    return service.recoverAccessProtocol(integration, data);
  }

  async listSuggestedDoctors(integrationId: string, filters: ListSuggestedDoctors): Promise<DoctorEntityDocument[]> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.listSuggestedDoctors) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.listSuggestedDoctors: Not implemented',
        undefined,
        true,
      );
    }

    return await service?.listSuggestedDoctors(integration, filters);
  }

  async agentUploadScheduleFile(integrationId: string, data: AgentUploadFile): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.validateRecoverAccessProtocol) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.agentUploadScheduleFile: Not implemented',
        undefined,
        true,
      );
    }

    return await service.agentUploadScheduleFile(integration, data);
  }

  async patientUploadScheduleFile(integrationId: string, data: PatientUploadFile): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.patientUploadScheduleFile) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.patientUploadScheduleFile: Not implemented',
        undefined,
        true,
      );
    }

    return await service.patientUploadScheduleFile(integration, data);
  }

  async agentDeleteScheduleFile(integrationId: string, data: AgentDeleteFile): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.agentDeleteScheduleFile) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.agentDeleteScheduleFile: Not implemented',
        undefined,
        true,
      );
    }

    return await service.agentDeleteScheduleFile(integration, data);
  }

  async patientDeleteScheduleFile(integrationId: string, data: PatientDeleteFile): Promise<OkResponse> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.patientDeleteScheduleFile) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.patientDeleteScheduleFile: Not implemented',
        undefined,
        true,
      );
    }

    return await service.patientDeleteScheduleFile(integration, data);
  }

  async listFileTypesToUpload(integrationId: string): Promise<DocumentUploadFileType[]> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.listFileTypesToUpload) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.listFileTypesToUpload: Not implemented',
        undefined,
        true,
      );
    }

    return await service.listFileTypesToUpload(integration);
  }

  async listSchedulesToActiveSending(
    integrationId: string,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    const { service, integration } = await this.validateIntegration(integrationId);

    if (!service.listSchedulesToActiveSending) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'IntegratorService.listSchedulesToActiveSending: Not implemented',
        undefined,
        true,
      );
    }

    return await service.listSchedulesToActiveSending(integration, data);
  }
}
