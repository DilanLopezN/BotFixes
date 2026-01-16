import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  ListAvailableSchedulesFilters,
  Reschedule,
  CreateSchedule,
  CreatePatient,
  UpdatePatient,
  ListDoctorSchedulesParams,
  ListDoctorSchedulesResponse,
  FindDoctorParams,
  FindDoctorResponse,
  CancelSchedule,
  ConfirmSchedule,
  CreateScheduleExam,
  AvailableSchedule,
  GetScheduleValue,
  RecoverAccessProtocol,
  RecoverAccessProtocolResponse,
  ReportSending,
  UpdateReportSending,
  UpdateReportSendingType,
  ListReportSending,
  AgentUploadScheduleFile,
  PatientUploadScheduleFile,
  ListFileTypesResponse,
  PatientDeleteScheduleFile,
  AgentDeleteScheduleFile,
  ListPatientSchedulesFilters,
  RescheduleExam,
  ListPatientSchedulesToUploadFileFilters,
  PatientSchedule,
} from 'kissbot-health-core';
import * as moment from 'moment';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import {
  AppointmentTypeEntityDocument,
  DoctorEntityDocument,
  EntityDocument,
  ScheduleType,
  TypeOfService,
  TypeOfServiceEntityDocument,
} from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  CreateSchedule as InternalCreateSchedule,
  IIntegratorService,
  InitialPatient,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  PatientFilters,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  CreatePatient as InternalCreatePatient,
  Reschedule as InternalReschedule,
  PatientSchedules,
  UpdatePatient as InternalUpdatePatient,
  ValidateScheduleConfirmation,
  AvailableSchedulesMetadata,
  ConfirmSchedule as InternalConfirmSchedule,
  CancelSchedule as InternalCancelSchedule,
  PatientFollowUpSchedules,
  GetScheduleValue as InternalGetScheduleValue,
  CountAvailableMedicalReportsResponse,
  ListAvailableMedicalReportsTokenData,
  ValidPatientReportDownloadRequest,
  HasAvailableMedicalReportsFilterRequest,
  HasAvailableMedicalReportsFilterResponse,
  ListAvailableMedicalReportsByPatientCode,
  AvailableMedicalReportsByScheduleCode,
  AgentUploadFile,
  PatientUploadFile,
} from '../../../integrator/interfaces';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  FollowUpAppointment,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { EntityType, EntityTypes, IDoctorEntity, SpecialityTypes } from '../../../interfaces/entity.interface';
import { OnDutyMedicalScale } from '../../../interfaces/on-duty-medical-scale.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { BotdesignerApiService } from './botdesigner-api.service';
import { BotdesignerConfirmationService } from './botdesigner-confirmation.service';
import { BotdesignerEntitiesService } from './botdesigner-entities.service';
import { BotdesignerHelpersService } from './botdesigner-helpers.service';
import { convertPhoneNumber, formatPhone } from '../../../../common/helpers/format-phone';
import { MatchFlowActions } from '../../../flow/interfaces/match-flow-actions';
import { orderBy, pick } from 'lodash';
import { BotdesignerDoctorService } from './botdesigner-doctor.service';
import { InterAppointmentService } from '../../../shared/inter-appointment.service';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { SchedulesService } from '../../../schedules/schedules.service';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { castObjectId, castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { removeHTMLTags } from '../../../../common/helpers/remove-html-tags';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntegrationService } from '../../../integration/integration.service';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { shouldRunCron } from '../../../../common/bootstrap-options';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../../common/queue-name';
import { SchedulingLinksService } from '../../../scheduling/services/scheduling-links.service';
import { DownloadMedicalReportTokenData } from '../../../scheduling/interfaces/download-token.interface';
import { SchedulingDownloadReportService } from 'health/scheduling/services/scheduling-download-report.service';
import { ApiQueueService, EndpointType, Message } from '../../../api/services/api-queue.service';
import { ListSuggestedDoctors } from '../../../integrator/interfaces/list-suggested-doctors.interface';
import { ListSchedules } from '../../../scheduling/interfaces/list-schedules.interface';
import { PatientDeleteFile } from '../../../integrator/interfaces/documents/patient-delete-file.interface';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { AuditService } from '../../../audit/services/audit.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { PatientSchedulesToUploadFile } from '../../../integrator/interfaces/patient-schedules-to-upload-file.interface';
import { formatHeight } from '../../../../common/helpers/format-height';
import { formatWeight } from '../../../../common/helpers/format-weight';

@Injectable()
export class BotdesignerService implements IIntegratorService {
  private readonly logger = new Logger(BotdesignerService.name);

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly botdesignerEntitiesService: BotdesignerEntitiesService,
    private readonly botdesignerConfirmationService: BotdesignerConfirmationService,
    private readonly botdesignerApiService: BotdesignerApiService,
    private readonly botdesignerHelpersService: BotdesignerHelpersService,
    private readonly botdesignerDoctorService: BotdesignerDoctorService,
    private readonly entitiesService: EntitiesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly interAppointmentService: InterAppointmentService,
    private readonly schedulesService: SchedulesService,
    private readonly schedulingLinksService: SchedulingLinksService,
    private readonly schedulingDownloadReportService: SchedulingDownloadReportService,
    private readonly apiQueueService: ApiQueueService,
    private readonly auditService: AuditService,
  ) {}

  async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: InternalConfirmSchedule,
  ): Promise<OkResponse> {
    try {
      const { appointmentCode: scheduleCode } = confirmSchedule;
      const payload: ConfirmSchedule = {
        scheduleCode,
        schedule: {
          patientCode: confirmSchedule.patientCode,
          appointmentTypeCode: confirmSchedule.data?.appointmentTypeCode || null,
        },
      };
      return await this.botdesignerApiService.confirmSchedule(integration, payload);
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('BotdesignerService.confirmSchedule', error);
    }
  }

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: InternalCancelSchedule): Promise<OkResponse> {
    try {
      const { appointmentCode: scheduleCode } = cancelSchedule;
      const payload: CancelSchedule = {
        scheduleCode,
        schedule: {
          patientCode: cancelSchedule.patientCode || cancelSchedule.patient?.code,
          appointmentTypeCode: cancelSchedule.data?.appointmentTypeCode || null,
        },
      };
      return await this.botdesignerApiService.cancelSchedule(integration, payload);
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('BotdesignerService.cancelSchedule', error);
    }
  }

  async createScheduleDefault(
    integration: IntegrationDocument,
    createSchedule: InternalCreateSchedule,
  ): Promise<Appointment> {
    try {
      const {
        appointment: { appointmentDate, code: appointmentCode, duration, data },
        organizationUnit,
        insurance,
        doctor,
        patient,
        procedure,
        speciality,
        appointmentType,
        typeOfService,
      } = createSchedule;

      const response: Appointment = {
        appointmentDate,
        duration,
        appointmentCode,
        status: AppointmentStatus.scheduled,
      };

      const procedureData = this.botdesignerHelpersService.getCompositeProcedureCode(integration, procedure?.code);
      const specialityData = this.botdesignerHelpersService.getCompositeSpecialityCode(integration, speciality?.code);
      const insurancePlanData = this.botdesignerHelpersService.getCompositePlanCode(integration, insurance.planCode);
      const insuranceSubPlanData = this.botdesignerHelpersService.getCompositeSubPlanCode(
        integration,
        insurance.subPlanCode,
      );
      const insuranceCategoryData = this.botdesignerHelpersService.getCompositePlanCategoryCode(
        integration,
        insurance.planCategoryCode,
      );

      const payload: CreateSchedule = {
        data: {
          patientCode: patient.code,
          doctorCode: doctor.code,
          duration: Number(duration),
          insuranceCode: insurance.code,
          scheduleDate: appointmentDate,
          scheduleCode: appointmentCode,
          organizationUnitCode: organizationUnit?.code || null,
          procedureCode: procedureData?.code || null,
          specialityCode: specialityData?.code || null,
          appointmentTypeCode: appointmentType.code,
          classificationCode: null,
          insurancePlanCode: insurancePlanData?.code || null,
          insuranceCategoryCode: insuranceCategoryData?.code || null,
          insuranceSubPlanCode: insuranceSubPlanData?.code || null,
          typeOfServiceCode: null,
          patientInsuranceNumber: null,
          patientHeight: null,
          patientWeight: null,
          data: data || null,
        },
      };

      if (patient.insuranceNumber) {
        payload.data.patientInsuranceNumber = patient.insuranceNumber;
      }

      if (patient.height) {
        payload.data.patientHeight = patient.height || null;
      }

      if (patient.weight) {
        payload.data.patientWeight = patient.weight || null;
      }

      if (typeOfService?.code) {
        const codeStr = String(typeOfService.code);

        const isNumeric = /^-?\d+$/.test(codeStr);
        const isValid = (isNumeric && Number(codeStr) > 0) || !isNumeric;

        if (isValid) {
          payload.data.typeOfServiceCode = codeStr;

          const entity: TypeOfServiceEntityDocument = await this.entitiesService.getEntityByCode(
            codeStr,
            EntityType.typeOfService,
            integration._id,
          );

          if (entity?.params?.referenceTypeOfService) {
            payload.data.classificationCode = this.botdesignerHelpersService.typeOfServiceToBotdesignerTypeOfService(
              entity.params.referenceTypeOfService,
            );
          }
        }
      }

      const result = await this.botdesignerApiService.createSchedule(integration, payload);

      if (result?.scheduleCode) {
        try {
          if (integration.rules?.sendGuidanceOnCreateSchedule) {
            if (result.data?.orientacao) {
              response.guidance = removeHTMLTags(result.data?.orientacao) || undefined;
            }
          }
        } catch (error) {
          console.log(error);
        }

        return response;
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.createSchedule', error);
    }
  }

  async createScheduleExam(
    integration: IntegrationDocument,
    createSchedule: InternalCreateSchedule,
  ): Promise<Appointment> {
    try {
      const {
        appointment: { appointmentDate, code: appointmentCode, duration, data },
        organizationUnit,
        insurance,
        doctor,
        patient,
        procedure,
        speciality,
        appointmentType,
        typeOfService,
        laterality,
      } = createSchedule;

      const response: Appointment = {
        appointmentDate,
        duration,
        appointmentCode,
        status: AppointmentStatus.scheduled,
      };

      const procedureData = this.botdesignerHelpersService.getCompositeProcedureCode(integration, procedure?.code);
      const specialityData = this.botdesignerHelpersService.getCompositeSpecialityCode(integration, speciality?.code);
      const insurancePlanData = this.botdesignerHelpersService.getCompositePlanCode(integration, insurance.planCode);
      const insuranceSubPlanData = this.botdesignerHelpersService.getCompositeSubPlanCode(
        integration,
        insurance.subPlanCode,
      );
      const insuranceCategoryData = this.botdesignerHelpersService.getCompositePlanCategoryCode(
        integration,
        insurance.planCategoryCode,
      );

      const payload: CreateScheduleExam = {
        data: {
          patientCode: patient.code,
          doctorCode: doctor?.code || null,
          duration: Number(duration),
          insuranceCode: insurance.code,
          scheduleDate: appointmentDate,
          scheduleCode: appointmentCode,
          organizationUnitCode: organizationUnit?.code || null,
          procedureCode: procedureData?.code || null,
          specialityCode: specialityData?.code || null,
          appointmentTypeCode: appointmentType.code,
          classificationCode: null,
          insurancePlanCode: insurancePlanData?.code || null,
          insuranceCategoryCode: insuranceCategoryData?.code || null,
          insuranceSubPlanCode: insuranceSubPlanData?.code || null,
          typeOfServiceCode: null,
          lateralityCode: laterality?.code,
          handedness: procedureData.lateralityCode,
          patientInsuranceNumber: null,
          patientHeight: null,
          patientWeight: null,
          data: data || null,
        },
      };

      if (patient.insuranceNumber) {
        payload.data.patientInsuranceNumber = patient.insuranceNumber;
      }

      if (patient.height) {
        payload.data.patientHeight = patient.height || null;
      }

      if (patient.weight) {
        payload.data.patientWeight = patient.weight || null;
      }

      if (typeOfService?.code && Number.isInteger(Number(typeOfService.code)) && Number(typeOfService.code) >= 0) {
        payload.data.typeOfServiceCode = typeOfService.code;
        const entity: TypeOfServiceEntityDocument = await this.entitiesService.getEntityByCode(
          typeOfService.code,
          EntityType.typeOfService,
          integration._id,
        );

        if (entity?.params?.referenceTypeOfService) {
          payload.data.classificationCode = this.botdesignerHelpersService.typeOfServiceToBotdesignerTypeOfService(
            entity.params.referenceTypeOfService,
          );
        }
      }

      const result = await this.botdesignerApiService.createScheduleExam(integration, payload);

      if (result?.scheduleCode) {
        try {
          if (integration.rules?.sendGuidanceOnCreateSchedule) {
            if (result.data?.orientacao) {
              response.guidance = removeHTMLTags(result.data?.orientacao) || undefined;
            }
          }
        } catch (error) {
          console.log(error);
        }

        return response;
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.createScheduleExam', error);
    }
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: InternalCreateSchedule): Promise<Appointment> {
    const { appointmentType } = createSchedule;

    const appointmentTypeEntity = (await this.entitiesService.getEntityByCode(
      appointmentType.code,
      EntityType.appointmentType,
      integration._id,
    )) as AppointmentTypeEntityDocument;

    if (appointmentTypeEntity.params?.referenceScheduleType === ScheduleType.Exam) {
      return await this.createScheduleExam(integration, createSchedule);
    }

    return await this.createScheduleDefault(integration, createSchedule);
  }

  async createPatient(integration: IntegrationDocument, { patient }: InternalCreatePatient): Promise<Patient> {
    const payload: CreatePatient = {
      data: {
        bornDate: patient.bornDate ? moment(patient.bornDate).format('YYYY-MM-DDTHH:mm:ss') : null,
        email: patient.email || null,
        sex: patient.sex?.toUpperCase(),
        name: patient.name,
        cpf: patient.cpf,
        phone: patient.phone ? formatPhone(convertPhoneNumber(patient.phone)) : null,
        cellPhone: patient.cellPhone ? formatPhone(convertPhoneNumber(patient.cellPhone)) : null,
        motherName: patient.motherName || null,
        skinColor: patient.skinColor || null,
        height: patient.height ? formatHeight(patient.height) : null,
        weight: patient.weight ? formatWeight(patient.weight) : null,
      },
    };

    try {
      const data = await this.botdesignerApiService.createPatient(integration, payload);
      if (data?.patientCode) {
        const createdPatient = await this.getPatient(integration, {
          bornDate: patient.bornDate,
          code: data.patientCode,
        });

        await this.integrationCacheUtilsService.setPatientCache(
          integration,
          data.patientCode,
          patient.cpf,
          createdPatient,
        );

        return createdPatient;
      }

      return null;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.createPatient', error);
    }
  }

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.botdesignerEntitiesService.extractEntity(integration, entityType, filter, cache);
  }

  private async createListAvailableSchedulesObject(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesFilters> {
    if (availableSchedules.dateLimit) {
      availableSchedules.untilDay = moment(availableSchedules.dateLimit).diff(
        moment().add(availableSchedules.fromDay + 1, 'days'),
        'days',
      );
    }

    const {
      filter: {
        insurance,
        organizationUnit,
        speciality,
        doctor,
        procedure,
        insurancePlan,
        appointmentType,
        typeOfService,
        organizationUnitLocation,
        planCategory,
        insuranceSubPlan,
        laterality,
      },
      patient,
      fromDay,
      untilDay,
      dateLimit,
    } = availableSchedules;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    const { start, end } = this.appointmentService.getPeriodFromPeriodOfDay(integration, {
      periodOfDay: availableSchedules.periodOfDay,
      limit: availableSchedules.limit,
      sortMethod: availableSchedules.sortMethod,
      randomize: availableSchedules.randomize,
      period: availableSchedules.period,
    });

    const payload: ListAvailableSchedulesFilters = {
      params: {
        startHour: start,
        endHour: end,
        insuranceCode: insurance.code,
        startDate: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
        endDate: moment()
          .add(fromDay + untilDay, 'days')
          .endOf('day')
          .format(dateFormat),
        doctorCode: [],
        patientAge: null,
        patientSex: null,
        procedureCode: null,
        organizationUnitCode: null,
        specialityCode: null,
        specialityType: null,
        handedness: null,
        patientCode: null,
        insurancePlanCode: null,
        appointmentTypeCode: null,
        classificationCode: null,
        insuranceCategoryCode: null,
        insuranceSubPlanCode: null,
        lateralityCode: null,
      } as ListAvailableSchedulesFilters['params'],
    };

    if (appointmentType?.code) {
      payload.params.appointmentTypeCode = appointmentType.code;
    }

    if (procedure?.code) {
      const procedureData = this.botdesignerHelpersService.getCompositeProcedureCode(integration, procedure.code);
      payload.params.procedureCode = procedureData.code;

      if (procedureData?.lateralityCode) {
        payload.params.handedness = procedureData.lateralityCode;
      }
    }

    if (speciality?.code) {
      const specialityData = this.botdesignerHelpersService.getCompositeSpecialityCode(integration, speciality.code);
      payload.params.specialityCode = specialityData.code;
      payload.params.specialityType = specialityData.specialityType;
    }

    if (doctor?.code) {
      payload.params.doctorCode = [doctor.code];
    }

    if (organizationUnit?.code) {
      payload.params.organizationUnitCode = [organizationUnit.code];
    }

    if (insurancePlan?.code) {
      const insurancePlanData = this.botdesignerHelpersService.getCompositePlanCode(integration, insurancePlan.code);
      payload.params.insurancePlanCode = insurancePlanData.code;
    }

    if (insuranceSubPlan?.code) {
      const insuranceSubPlanData = this.botdesignerHelpersService.getCompositeSubPlanCode(
        integration,
        insuranceSubPlan.code,
      );
      payload.params.insuranceSubPlanCode = insuranceSubPlanData.code;
    }

    if (planCategory?.code) {
      const insuranceCategoryData = this.botdesignerHelpersService.getCompositePlanCategoryCode(
        integration,
        planCategory.code,
      );
      payload.params.insuranceCategoryCode = insuranceCategoryData.code;
    }

    const referenceTypeOfService = typeOfService?.params?.referenceTypeOfService;

    if (referenceTypeOfService === TypeOfService.custom) {
      payload.params.classificationCode = typeOfService.code;
    } else if (referenceTypeOfService) {
      payload.params.classificationCode = this.botdesignerHelpersService.typeOfServiceToBotdesignerTypeOfService(
        typeOfService.params.referenceTypeOfService,
      );
    }

    if (organizationUnitLocation?.code) {
      payload.params.organizationUnitLocationCode = organizationUnitLocation?.code;
    }

    if (laterality?.code) {
      payload.params.lateralityCode = laterality?.code;
    }

    if (patient?.bornDate) {
      const patientAge = moment().diff(patient.bornDate, 'years');
      payload.params.patientAge = patientAge;
    }

    if (patient?.sex) {
      payload.params.patientSex = patient.sex;
    }

    if (patient?.code) {
      payload.params.patientCode = patient.code;
    }

    if (dateLimit && moment(payload.params.endDate).valueOf() > moment(dateLimit).valueOf()) {
      payload.params.endDate = moment(dateLimit).endOf('day').format(dateFormat);
    }

    if (dateLimit && moment(payload.params.startDate).valueOf() > moment(dateLimit).valueOf()) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_GATEWAY,
        {
          message: `dateLimit effect : initialDate ${payload.params.startDate}`,
        },
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    return payload;
  }

  public async splitGetAvailableSchedules(
    integration: IntegrationDocument,
    payload: ListAvailableSchedulesFilters,
    availableSchedules: ListAvailableSchedules,
  ): Promise<AvailableSchedule[]> {
    const range = availableSchedules.untilDay;
    const maxRangeDays = integration.rules?.limitOfDaysToSplitRequestInScheduleSearch || 10;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    if (
      range <= maxRangeDays ||
      availableSchedules.filter?.typeOfService?.params?.referenceTypeOfService === TypeOfService.followUp
    ) {
      return await this.botdesignerApiService.listAvailableSchedules(integration, payload);
    }

    const requestsNumber = Math.ceil(range / maxRangeDays);

    const responsePromises = [];
    const response: AvailableSchedule[] = [];

    for (let stack = 0; stack < requestsNumber; stack++) {
      const fromDay = availableSchedules.fromDay + stack * maxRangeDays;
      const untilDay = fromDay + maxRangeDays;

      const dynamicPayload: ListAvailableSchedulesFilters = {
        ...payload,
        params: {
          ...payload.params,
          startDate: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
          endDate: moment().add(untilDay, 'days').endOf('day').format(dateFormat),
        },
      };

      // se for o último do loop pega a diferença dos dias para não pegar mais do que o informado na request
      if (stack + 1 === requestsNumber) {
        const newUntilDay = moment().add(untilDay, 'days').diff(moment().add(range, 'days'), 'days');
        dynamicPayload.params.endDate = moment()
          .add(fromDay + newUntilDay, 'days')
          .endOf('day')
          .format(dateFormat);
      }

      responsePromises.push(this.botdesignerApiService.listAvailableSchedules(integration, dynamicPayload));
    }

    await Promise.allSettled(responsePromises).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(({ value }: PromiseFulfilledResult<AvailableSchedule[]>) => {
          response.push(...(value ?? []));
        });
    });

    return response;
  }

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const {
      filter,
      patient,
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      limit,
      periodOfDay,
    } = availableSchedules;

    let interAppointmentPeriodApplied: number = undefined;
    const doctorsScheduledMapped = new Map<string, number>();

    try {
      if (
        patient?.code &&
        filter.insurance?.code &&
        filter.appointmentType?.params?.referenceScheduleType === ScheduleType.Consultation
      ) {
        const [doctorsScheduledMap, interAppointmentPeriod] =
          await this.interAppointmentService.validateInsuranceInterAppointment(
            integration,
            filter,
            patient.code,
            this.getMinifiedPatientSchedules.bind(this),
            undefined,
            null,
            availableSchedules.appointmentCodeToCancel ? [availableSchedules.appointmentCodeToCancel] : undefined,
          );

        doctorsScheduledMap.forEach((value, key) => {
          doctorsScheduledMapped.set(key, value);
        });

        if (interAppointmentPeriod > 0 && availableSchedules.fromDay < interAppointmentPeriod) {
          interAppointmentPeriodApplied = interAppointmentPeriod;
          availableSchedules.fromDay = interAppointmentPeriod;
        }
      }
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, error);
    }

    const metadata: AvailableSchedulesMetadata = {
      interAppointmentPeriod: interAppointmentPeriodApplied,
    };

    const payload = await this.createListAvailableSchedulesObject(integration, availableSchedules);
    const results = await this.splitGetAvailableSchedules(integration, payload, availableSchedules);

    if (results?.length === 0) {
      return { schedules: [], metadata: null };
    }

    // só precisa dos médicos se for consulta
    if (availableSchedules?.filter?.appointmentType?.code !== SpecialityTypes.E) {
      await this.botdesignerHelpersService.setExternalDoctorsEntityAndCacheIt(integration);
    }

    const schedules: RawAppointment[] = [];

    const doctors: DoctorEntityDocument[] = await this.entitiesService.getEntities(
      EntityType.doctor,
      { canSchedule: true },
      integration._id,
    );

    const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
      integrationId: integration._id,
      entities: doctors,
      entitiesFilter: availableSchedules.filter,
      targetEntity: FlowSteps.listAppointments,
      filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
    });

    const validInternalDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
      bornDate: patient?.bornDate,
    });

    const validInternalDoctorsMap = validInternalDoctors?.reduce((map: { [key: string]: IDoctorEntity }, doctor) => {
      map[doctor.code] = doctor;
      return map;
    }, {});

    const validExternalDoctors = await this.botdesignerHelpersService.getExternalDoctorsEntityAndCacheIt(integration);

    const validExternalDoctorsMap = validExternalDoctors?.reduce((map: { [key: string]: IDoctorEntity }, doctor) => {
      map[doctor.code] = doctor;
      return map;
    }, {});

    for (const botdesignerSchedule of results) {
      // cria objeto de agendamento validando entidade interna ou externa
      const schedule: RawAppointment = await this.botdesignerHelpersService.createAvailableScheduleObject(
        integration,
        botdesignerSchedule,
        availableSchedules,
        validExternalDoctorsMap,
        validInternalDoctorsMap,
      );

      if (!schedule) {
        continue;
      }

      try {
        if (botdesignerSchedule?.data?.opcional1) {
          schedule.data = { opcional1: botdesignerSchedule?.data?.opcional1 };
        }
      } catch (error) {
        console.log(error);
      }

      try {
        if (integration.rules?.sendObservationOnListSchedules && botdesignerSchedule.data?.observacao) {
          schedule.observation = removeHTMLTags(botdesignerSchedule.data?.observacao) || undefined;
        }
      } catch (error) {
        console.log(error);
      }

      const filteredInterAppointmentSchedules = this.interAppointmentService.filterInterAppointmentByDoctorCode(
        integration,
        schedule,
        doctorsScheduledMapped,
        filter,
      );

      if (!filteredInterAppointmentSchedules) {
        continue;
      }

      schedules.push(filteredInterAppointmentSchedules);
    }

    const { appointments: randomizedAppointments, metadata: partialMetadata } =
      await this.appointmentService.getAppointments(
        integration,
        {
          limit,
          period,
          randomize,
          sortMethod,
          periodOfDay,
        },
        schedules,
      );

    const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
    return { schedules: validSchedules, metadata: { ...metadata, ...partialMetadata } };
  }

  async getScheduleValue(
    integration: IntegrationDocument,
    scheduleValue: InternalGetScheduleValue,
  ): Promise<AppointmentValue> {
    const { insurance, procedure, doctor, organizationUnit, scheduleCode, speciality, appointmentType } = scheduleValue;

    const procedureData = this.botdesignerHelpersService.getCompositeProcedureCode(integration, procedure?.code);
    const specialityData = this.botdesignerHelpersService.getCompositeSpecialityCode(
      integration,
      speciality?.code || procedure?.specialityCode,
    );
    const insurancePlanData = this.botdesignerHelpersService.getCompositePlanCode(integration, insurance.planCode);
    const insuranceSubPlanData = this.botdesignerHelpersService.getCompositeSubPlanCode(
      integration,
      insurance.subPlanCode,
    );
    const insuranceCategoryData = this.botdesignerHelpersService.getCompositePlanCategoryCode(
      integration,
      insurance.planCategoryCode,
    );

    const payload: GetScheduleValue = {
      data: {
        specialityCode: specialityData?.code || null,
        insuranceCode: insurance?.code || null,
        insurancePlanCode: insurancePlanData?.code || null,
        insuranceSubPlanCode: insuranceSubPlanData?.code || null,
        insuranceCategoryCode: insuranceCategoryData?.code || null,
        procedureCode: procedureData?.code || null,
        appointmentTypeCode: appointmentType?.code || null,
        patientCode: '',
        scheduleCode: scheduleCode || null,
        classificationCode: null,
        doctorCode: doctor?.code || null,
        occupationAreaCode: null,
        organizationUnitCode: organizationUnit?.code || null,
        typeOfServiceCode: null,
      },
    };

    try {
      const data = await this.botdesignerApiService.getScheduleValue(integration, payload);

      if (!data?.value) {
        return null;
      }

      if (!data.value || Number(data.value) <= 0) {
        return null;
      }

      const response: AppointmentValue = {
        currency: 'R$',
        value: formatCurrency(data?.value),
        observation: data.observation,
      };

      return response;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.getScheduleValue', error);
    }
  }

  async getEntityList(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    switch (targetEntity) {
      case EntityType.laterality:
      case EntityType.speciality:
      case EntityType.organizationUnit:
      case EntityType.insurance:
      case EntityType.insurancePlan:
      case EntityType.typeOfService:
      case EntityType.appointmentType:
      case EntityType.procedure:
      case EntityType.doctor:
      case EntityType.planCategory:
      case EntityType.insuranceSubPlan:
      case EntityType.occupationArea:
      case EntityType.organizationUnitLocation:
        const allEntities = await this.botdesignerEntitiesService.listApiEntities(
          integration,
          targetEntity,
          filters,
          cache,
          patient,
        );

        return allEntities as EntityDocument[];

      default:
        return [] as EntityDocument[];
    }
  }

  async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { patientCode, startDate, specialityCode, organizationUnitLocationCode } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const filters: ListPatientSchedulesFilters = {
        params: {
          code: patientCode,
          startDate: startDate ? moment(startDate).format('YYYY-MM-DDTHH:mm:ss') : null,
        },
      };

      try {
        if (specialityCode) {
          const specialityCodes = specialityCode
            .split(',')
            .map((code) => code.trim())
            .filter(Boolean);

          const codes: string[] = [];

          for (const code of specialityCodes) {
            const specialityData = this.botdesignerHelpersService.getCompositeSpecialityCode(integration, code);

            if (specialityData?.code) {
              codes.push(specialityData.code);
            }
          }

          if (codes.length > 0) {
            filters.params.specialityCode = codes;
          }
        }
      } catch (error) {}

      if (organizationUnitLocationCode) {
        filters.params.organizationUnitLocationCode = [organizationUnitLocationCode];
      }

      const data = await this.botdesignerApiService.listPatientSchedules(integration, filters);

      if (!data?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        data?.map(async (botdesignerSchedule) => {
          const [schedule] = await this.appointmentService.transformSchedules(integration, [
            await this.botdesignerHelpersService.createPatientAppointmentObject(integration, botdesignerSchedule),
          ]);

          const flowSteps: FlowSteps[] = [FlowSteps.listPatientSchedules];

          if (patientSchedules.target) {
            flowSteps.push(patientSchedules.target);
          }

          const matchFlows: MatchFlowActions = {
            integrationId: integration._id,
            targetFlowTypes: flowSteps,
            entitiesFilter: {
              ...pick(schedule, [
                EntityType.appointmentType,
                EntityType.doctor,
                EntityType.procedure,
                EntityType.insurance,
                EntityType.insurancePlan,
                EntityType.organizationUnit,
                EntityType.speciality,
                EntityType.organizationUnitLocation,
                EntityType.occupationArea,
                EntityType.typeOfService,
                EntityType.insuranceSubPlan,
                EntityType.planCategory,
              ]),
            },
          };

          const flowActions = await this.flowService.matchFlowsAndGetActions(matchFlows);

          minifiedSchedules.appointmentList.push({
            appointmentCode: String(botdesignerSchedule.scheduleCode),
            appointmentDate: schedule.appointmentDate,
          });

          return {
            ...schedule,
            actions: flowActions,
          };
        }),
      );

      orderBy(schedules, 'appointmentDate', 'asc').forEach((schedule) => {
        if (moment(schedule.appointmentDate).valueOf() > moment().valueOf() && !minifiedSchedules.nextAppointment) {
          minifiedSchedules.nextAppointment = schedule;
        } else if (moment(schedule.appointmentDate).valueOf() <= moment().valueOf()) {
          minifiedSchedules.lastAppointment = schedule;
        }
      });

      await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
        minifiedSchedules,
        schedules,
      });

      return minifiedSchedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.getMinifiedPatientSchedules', error);
    }
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    try {
      const { cpf, code, cache } = filters;
      const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

      if (patientCache && cache) {
        return patientCache;
      }

      const botdesignerPatient = await this.botdesignerApiService.getPatient(integration, {
        params: {
          cpf,
          code,
        },
      });

      if (!botdesignerPatient?.code) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      const patient = this.botdesignerHelpersService.replaceBotdesignerPatientToPatient(botdesignerPatient);
      await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.getPatient', error);
    }
  }

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, startDate, specialityCode, organizationUnitLocationCode } = patientSchedules;

    try {
      const filters: ListPatientSchedulesFilters = {
        params: {
          code: patientCode,
          startDate: startDate ? moment(startDate).format('YYYY-MM-DDTHH:mm:ss') : null,
        },
      };

      try {
        if (specialityCode) {
          const specialityCodes = specialityCode
            .split(',')
            .map((code) => code.trim())
            .filter(Boolean);

          const codes: string[] = [];

          for (const code of specialityCodes) {
            const specialityData = this.botdesignerHelpersService.getCompositeSpecialityCode(integration, code);

            if (specialityData?.code) {
              codes.push(specialityData.code);
            }
          }

          if (codes.length > 0) {
            filters.params.specialityCode = codes;
          }
        }
      } catch (error) {}

      if (organizationUnitLocationCode) {
        filters.params.organizationUnitLocationCode = [organizationUnitLocationCode];
      }

      const data = await this.botdesignerApiService.listPatientSchedules(integration, filters);

      return await this.appointmentService.transformSchedules(
        integration,
        await Promise.all(
          data?.map(
            async (schedule) =>
              await this.botdesignerHelpersService.createPatientAppointmentObject(integration, schedule),
          ),
        ),
        false,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.getPatientSchedules', error);
    }
  }

  async listPatientSchedulesToUploadFile(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedulesToUploadFile,
  ): Promise<Appointment[]> {
    const { patientCpf, erpUsername } = patientSchedules;

    try {
      const filters: ListPatientSchedulesToUploadFileFilters = {
        params: {
          code: null,
          erpUsername,
          cpf: patientCpf,
        },
      };

      const data = await this.botdesignerApiService.listPatientSchedulesToUploadFile(integration, filters);

      return await this.appointmentService.transformSchedules(
        integration,
        await Promise.all(
          data?.map(
            async (schedule) =>
              await this.botdesignerHelpersService.createPatientAppointmentObject(
                integration,
                schedule as PatientSchedule,
              ),
          ),
        ),
        false,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.listPatientSchedulesToUploadFile', error);
    }
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const organizationUnits = await this.botdesignerApiService.listOrganizationUnits(
        integration,
        {
          params: {
            appointmentTypeCode: ['C'],
          },
        },
        true,
      );
      if (organizationUnits?.length) {
        return { ok: true };
      }

      const insurances = await this.botdesignerApiService.listInsurances(
        integration,
        {
          params: {
            appointmentTypeCode: ['C'],
          },
        },
        true,
      );
      if (insurances?.length) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw error;
    }
  }

  async reschedule(integration: IntegrationDocument, reschedule: InternalReschedule): Promise<Appointment> {
    const { appointmentType } = reschedule.scheduleToCreate;

    const appointmentTypeEntity = (await this.entitiesService.getEntityByCode(
      appointmentType.code,
      EntityType.appointmentType,
      integration._id,
    )) as AppointmentTypeEntityDocument;

    if (appointmentTypeEntity.params?.referenceScheduleType === ScheduleType.Exam) {
      return await this.rescheduleExam(integration, reschedule);
    }

    return await this.rescheduleDefault(integration, reschedule);
  }

  async rescheduleDefault(integration: IntegrationDocument, reschedule: InternalReschedule): Promise<Appointment> {
    try {
      const {
        patient,
        scheduleToCancelCode,
        scheduleToCreate: {
          appointment: { appointmentDate, code: appointmentCode },
          organizationUnit,
          insurance,
          doctor,
          procedure,
          speciality,
          appointmentType,
        },
      } = reschedule;

      const response: Appointment = {
        appointmentDate,
        duration: null,
        appointmentCode,
        status: AppointmentStatus.scheduled,
      };

      const procedureData = this.botdesignerHelpersService.getCompositeProcedureCode(integration, procedure?.code);
      const specialityData = this.botdesignerHelpersService.getCompositeSpecialityCode(integration, speciality?.code);
      const insurancePlanData = this.botdesignerHelpersService.getCompositePlanCode(integration, insurance.planCode);
      const insuranceSubPlanData = this.botdesignerHelpersService.getCompositeSubPlanCode(
        integration,
        insurance.subPlanCode,
      );
      const insuranceCategoryData = this.botdesignerHelpersService.getCompositePlanCategoryCode(
        integration,
        insurance.planCategoryCode,
      );

      const payload: Reschedule = {
        data: {
          scheduleCodeToUpdate: scheduleToCancelCode,
          patientCode: patient.code,
          doctorCode: doctor.code,
          duration: 0,
          insuranceCode: insurance.code,
          scheduleDate: appointmentDate,
          scheduleCode: appointmentCode,
          organizationUnitCode: organizationUnit.code,
          procedureCode: procedureData?.code || null,
          specialityCode: specialityData.code || null,
          appointmentTypeCode: appointmentType.code,
          classificationCode: null,
          insurancePlanCode: insurancePlanData?.code || null,
          insuranceCategoryCode: insuranceCategoryData?.code || null,
          insuranceSubPlanCode: insuranceSubPlanData?.code || null,
          typeOfServiceCode: null,
          patientInsuranceNumber: null,
          patientHeight: null,
          patientWeight: null,
        },
      };

      if (patient.insuranceNumber) {
        payload.data.patientInsuranceNumber = patient.insuranceNumber;
      }

      if (patient.height) {
        payload.data.patientHeight = patient.height || null;
      }

      if (patient.weight) {
        payload.data.patientWeight = patient.weight || null;
      }

      const result = await this.botdesignerApiService.reschedule(integration, payload);

      if (result?.scheduleCode) {
        try {
          if (integration.rules?.sendGuidanceOnCreateSchedule) {
            if (result.data?.orientacao) {
              response.guidance = removeHTMLTags(result.data?.orientacao) || undefined;
            }
          }
        } catch (error) {
          console.log(error);
        }

        return response;
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.reschedule', error);
    }
  }

  async rescheduleExam(integration: IntegrationDocument, reschedule: InternalReschedule): Promise<Appointment> {
    try {
      const {
        patient,
        scheduleToCancelCode,
        scheduleToCreate: {
          appointment: { appointmentDate, code: appointmentCode },
          organizationUnit,
          insurance,
          doctor,
          procedure,
          speciality,
          appointmentType,
          laterality,
          data,
        },
      } = reschedule;

      const response: Appointment = {
        appointmentDate,
        duration: null,
        appointmentCode,
        status: AppointmentStatus.scheduled,
      };

      const procedureData = this.botdesignerHelpersService.getCompositeProcedureCode(integration, procedure?.code);
      const specialityData = this.botdesignerHelpersService.getCompositeSpecialityCode(integration, speciality?.code);
      const insurancePlanData = this.botdesignerHelpersService.getCompositePlanCode(integration, insurance.planCode);
      const insuranceSubPlanData = this.botdesignerHelpersService.getCompositeSubPlanCode(
        integration,
        insurance.subPlanCode,
      );
      const insuranceCategoryData = this.botdesignerHelpersService.getCompositePlanCategoryCode(
        integration,
        insurance.planCategoryCode,
      );

      const payload: RescheduleExam = {
        data: {
          scheduleCodeToUpdate: scheduleToCancelCode,
          patientCode: patient.code,
          doctorCode: doctor.code,
          duration: 0,
          insuranceCode: insurance.code,
          scheduleDate: appointmentDate,
          scheduleCode: appointmentCode,
          organizationUnitCode: organizationUnit.code,
          procedureCode: procedureData?.code || null,
          specialityCode: specialityData.code || null,
          appointmentTypeCode: appointmentType.code,
          classificationCode: null,
          insurancePlanCode: insurancePlanData?.code || null,
          insuranceCategoryCode: insuranceCategoryData?.code || null,
          insuranceSubPlanCode: insuranceSubPlanData?.code || null,
          typeOfServiceCode: null,
          lateralityCode: laterality?.code,
          patientInsuranceNumber: null,
          patientHeight: null,
          patientWeight: null,
          data: data || null,
        },
      };

      if (patient.insuranceNumber) {
        payload.data.patientInsuranceNumber = patient.insuranceNumber;
      }

      if (patient.height) {
        payload.data.patientHeight = patient.height || null;
      }

      if (patient.weight) {
        payload.data.patientWeight = patient.weight || null;
      }

      const result = await this.botdesignerApiService.rescheduleExam(integration, payload);

      if (result?.scheduleCode) {
        try {
          if (integration.rules?.sendGuidanceOnCreateSchedule) {
            if (result.data?.orientacao) {
              response.guidance = removeHTMLTags(result.data?.orientacao) || undefined;
            }
          }
        } catch (error) {
          console.log(error);
        }

        return response;
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.reschedule', error);
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: InternalUpdatePatient,
  ): Promise<Patient> {
    const payload: UpdatePatient = {
      data: {
        code: patientCode,
        email: patient.email || null,
        phone: patient.phone ? formatPhone(convertPhoneNumber(patient.phone)) : null,
        cellPhone: patient.cellPhone ? formatPhone(convertPhoneNumber(patient.cellPhone)) : null,
        height: patient.height ? formatHeight(patient.height) : null,
        weight: patient.weight ? formatWeight(patient.weight) : null,
      },
    };

    try {
      const data = await this.botdesignerApiService.updatePatient(integration, payload);
      if (data?.patientCode) {
        await this.integrationCacheUtilsService.removePatientFromCache(integration, patientCode, patient.cpf);
        const createdPatient = await this.getPatient(integration, {
          bornDate: patient.bornDate,
          code: data.patientCode,
        });

        await this.integrationCacheUtilsService.setPatientCache(
          integration,
          data.patientCode,
          patient.cpf,
          createdPatient,
        );

        return createdPatient;
      }

      return null;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.updatePatient', error);
    }
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    return await this.botdesignerConfirmationService.matchFlowsConfirmation(integration, data);
  }

  public async getConfirmationScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    return await this.botdesignerConfirmationService.getScheduleGuidance(integration, data);
  }

  public async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.botdesignerConfirmationService.listSchedulesToConfirm(integration, data);
  }

  async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return await this.botdesignerConfirmationService.cancelSchedule(integration, cancelSchedule);
  }

  async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.botdesignerConfirmationService.confirmSchedule(integration, confirmSchedule);
  }

  async listDoctorSchedules(
    integration: IntegrationDocument,
    data: ListDoctorSchedulesParams,
  ): Promise<ListDoctorSchedulesResponse[]> {
    return await this.botdesignerDoctorService.listDoctorSchedules(integration, data);
  }

  async findDoctor(integration: IntegrationDocument, data: FindDoctorParams): Promise<FindDoctorResponse> {
    return await this.botdesignerDoctorService.findDoctor(integration, data);
  }

  async listOnDutyMedicalScale(integration: IntegrationDocument): Promise<OnDutyMedicalScale[]> {
    const data = await this.botdesignerApiService.listOnDutyMedicalScale(integration);
    return data?.map((item) => ({
      doctor: {
        name: item.doctorName,
        code: item.doctorCode,
      },
      specialityName: item.specialityName,
      attendancePeriod: item.attendancePeriod,
    }));
  }

  public async validateScheduleData(
    integration: IntegrationDocument,
    data: ValidateScheduleConfirmation,
  ): Promise<OkResponse> {
    try {
      return await this.botdesignerConfirmationService.validateScheduleData(integration, data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.validateScheduleData', error);
    }
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    try {
      return await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        null,
        data.scheduleId,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.getConfirmationScheduleById', error);
    }
  }

  async getPatientFollowUpSchedules(
    integration: IntegrationDocument,
    filters: PatientFollowUpSchedules,
  ): Promise<FollowUpAppointment[]> {
    const { patientCode } = filters;

    try {
      const data = await this.botdesignerApiService.listPatientSchedules(integration, {
        params: {
          code: patientCode,
          startDate: moment().subtract(60, 'days').format('YYYY-MM-DDTHH:mm:ss'),
        },
      });

      if (!data) {
        return [];
      }

      const typeOfServiceFollowUp: TypeOfServiceEntityDocument = await this.entitiesService
        .getModel(EntityType.typeOfService)
        .findOne({
          'params.referenceTypeOfService': TypeOfService.followUp,
          integrationId: castObjectId(integration._id),
        });

      const schedules: FollowUpAppointment[] = await Promise.all(
        data
          .filter((schedule) => schedule.followUpDateLimit && moment(schedule.followUpDateLimit).isAfter())
          .map(async (schedule) => {
            const replacedEntities = await this.entitiesService.createCorrelationFilterData(
              {
                procedure: this.botdesignerHelpersService.createCompositeProcedureCode(
                  integration,
                  schedule.procedureCode,
                  schedule.specialityCode,
                  schedule.appointmentTypeCode,
                  null,
                  this.botdesignerHelpersService.getHandedness(integration._id),
                ),
                speciality: this.botdesignerHelpersService.createCompositeSpecialityCode(
                  integration,
                  schedule.specialityCode,
                  schedule.appointmentTypeCode,
                ),
                insurancePlan: schedule.insurancePlanCode
                  ? this.botdesignerHelpersService.createCompositePlanCode(
                      integration,
                      schedule.insurancePlanCode,
                      schedule.insuranceCode,
                    )
                  : null,
                planCategory: schedule.insuranceCategoryCode
                  ? this.botdesignerHelpersService.createCompositePlanCategoryCode(
                      integration,
                      schedule.insuranceCategoryCode,
                      schedule.insuranceCode,
                    )
                  : null,
                doctor: schedule.doctorCode,
                organizationUnit: schedule.organizationUnitCode,
                insurance: schedule.insuranceCode,
                appointmentType: schedule.appointmentTypeCode,
                typeOfService: schedule.typeOfServiceCode,
                occupationArea: schedule.occupationAreaCode,
                organizationUnitLocation: schedule.organizationUnitLocationCode,
              },
              'code',
              integration._id,
            );

            const followUpSchedule: FollowUpAppointment = {
              ...replacedEntities,
              followUpLimit: schedule.followUpDateLimit,
              appointmentDate: schedule.scheduleDate,
              inFollowUpPeriod: moment(schedule.followUpDateLimit).isSameOrAfter(moment()),
              typeOfServiceFollowUp: typeOfServiceFollowUp,
            };

            return followUpSchedule;
          }),
      );

      return schedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.getPatientFollowUpSchedules', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledSendingLoaderCron() {
    if (!shouldRunCron()) {
      return;
    }
    await this.scheduledSendingLoader();
  }

  async scheduledSendingLoader() {
    try {
      const integrations = await this.integrationService.getAllIntegrationsWithScheduledSending();
      if (!integrations?.length) {
        return;
      }

      const promises = integrations.map(async (integration) => {
        try {
          return this.botdesignerApiService.executeScheduledSendingLoader(integration);
        } catch (error) {
          console.error(error);
          this.logger.error('error to get the integration', error);
        }
      });

      Promise.allSettled(promises);
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER(`BotdesignerService.${this.scheduledSendingLoader.name}`, error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledSendingCron() {
    if (!shouldRunCron()) {
      return;
    }
    await this.scheduledSending();
  }

  async scheduledSending(filter?: {
    startDate: string;
    endDate: string;
    integrations: IntegrationDocument[];
  }): Promise<void> {
    try {
      let integrations = filter?.integrations;
      if (!filter?.integrations) {
        integrations = await this.integrationService.getAllIntegrationsWithScheduledSending();
      }

      if (!integrations?.length) {
        return;
      }

      const messages: Message[] = [];
      const promises = await integrations.map(async (integration) => {
        try {
          const scheduledSendingData = await this.botdesignerApiService.listScheduledSending(integration, {
            params: {
              startDate: filter?.startDate || moment().startOf('day').subtract(3, 'days').format('YYYY-MM-DD HH:mm:ss'),
              endDate: filter?.endDate || moment().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
            },
          });

          const messagesByIntegration: Message[] = scheduledSendingData.map((data) => ({
            messageBody: {
              attributes: data.attrs,
              customFlow: data.customFlow,
              id: String(data.id),
              integrationId: integration._id.toString(),
              internalId: data.internalId,
              phone: data.phone,
              token: data.token,
            },
            callback: () => {
              return this.botdesignerApiService.updateScheduledSending(integration, { data: [data.id.toString()] });
            },
          }));

          messages.push(...messagesByIntegration);
        } catch (error) {
          console.error(error);
          this.logger.error('error to get the integration', error);
        }
      });

      await Promise.allSettled(promises);

      await this.apiQueueService.enqueue(messages);
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER(`BotdesignerService.${this.scheduledSending.name}`, error);
    }
  }

  async validateRecoverAccessProtocol(): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async recoverAccessProtocol(
    integration: IntegrationDocument,
    data: RecoverAccessProtocol,
  ): Promise<RecoverAccessProtocolResponse> {
    try {
      return await this.botdesignerApiService.recoverAccessProtocol(integration, { params: data });
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER(`BotdesignerService.${this.recoverAccessProtocol.name}`, error.message);
    }
  }

  async updateReportSending(integration: IntegrationDocument, data: UpdateReportSending): Promise<OkResponse> {
    try {
      return this.botdesignerApiService.updateReportSending(integration, data);
    } catch (error) {
      this.logger.error(error);
      return { ok: false };
    }
  }

  @RabbitSubscribe({
    exchange: process.env.EVENTS_EXCHANGE_NAME || 'events',
    routingKey: ['integration.health.report-sending'],
    queue: getQueueName('REPORT_SENDING'),
    queueOptions: {
      durable: true,
      arguments: {
        'x-single-active-consumer': true,
      },
      channel: BotdesignerService.name,
    },
  })
  async reportSending(event: string): Promise<void> {
    try {
      const reportSendingEvents: ReportSending[] = JSON.parse(event);
      if (!reportSendingEvents.length) return;
      this.auditService.sendAuditEvent({
        dataType: AuditDataType.internalResponse,
        integrationId: castObjectIdToString(reportSendingEvents[0].integrationId),
        data: reportSendingEvents,
        identifier: 'REPORT_SENDING_AFTER_RABBITMQ',
      });
      const integration = await this.integrationService.getOne(reportSendingEvents[0].integrationId);
      const { apiToken } = integration?.reportConfig;
      if (!apiToken && !integration.scheduling.active) {
        throw Error('Need integration apiToken and scheduling is active');
      }

      const schedulesByUser: { [key: string]: ReportSending[] } = reportSendingEvents.reduce((acc, reportSending) => {
        if (acc[reportSending.patientCode]) {
          acc[reportSending.patientCode].push(reportSending);
        } else {
          acc[reportSending.patientCode] = [reportSending];
        }
        return acc;
      }, {});

      const promises = Object.values(schedulesByUser).map(async (schedulesUser) => {
        const data = {
          integrationId: castObjectIdToString(integration._id),
          patientErpCode: schedulesUser[0].patientCode,
          patientCpf: schedulesUser[0]?.patientCpf,
          scheduleCode: schedulesUser.length > 1 ? undefined : schedulesUser[0].scheduleCode,
          link: 'documents',
        };

        const { scheduleResumeLink } =
          await this.schedulingLinksService.createSchedulingLinkGroupedByPatientErpCodeAndScheduleCode(
            integration,
            data,
          );
        return { ...schedulesUser[0], URL_0: `${scheduleResumeLink.shortPathLink}` };
      });

      const reportWithscheduleResumeLink = (await Promise.allSettled(promises))
        .filter((reportSending) => reportSending.status === 'fulfilled')
        .map((cachedScheduledSending: PromiseFulfilledResult<any>) => cachedScheduledSending.value);

      const messages: Message[] = reportWithscheduleResumeLink.map((message: ReportSending & { URL_0: string }) => ({
        messageBody: {
          integrationId: integration._id.toString(),
          id: message.patientCode,
          phone: message.phoneNumber,
          token: apiToken,
          externalId: message.id ? String(message.id) : null,
          sendType: 'medical_report',
          attributes: [
            {
              name: 'contact.name',
              value: message.patientName,
            },
            {
              name: 'contact.code',
              value: message.patientCode,
            },
            {
              name: 'schedule.code',
              value: message.scheduleCode,
            },
            {
              name: 'schedule.date',
              value: moment(message.scheduleDate).format('YYYY-MM-DDTHH:mm:ss'),
            },
            {
              name: 'URL_0',
              value: message.URL_0,
            },
          ],
        },
        callback: () =>
          this.updateReportSending(integration, {
            params: {
              type: UpdateReportSendingType.SENT,
              valuesToUpdate: [message.patientCode],
            },
          }),
        config: { endpointType: EndpointType.TRACKED },
      }));

      await this.apiQueueService.enqueue(messages);
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async listAvailableMedicalReportsByPatientCode(
    integration: IntegrationDocument,
    validPatient: ListAvailableMedicalReportsTokenData,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReportsByPatientCode>> {
    if (!validPatient.patientCode) {
      return { count: 0, data: [] };
    }

    const reports = await this.botdesignerApiService.listReportSending(integration, {
      params: { patientCode: validPatient.patientCode },
    });

    const reportSchedules = await Promise.all(
      reports?.map((report) =>
        this.botdesignerHelpersService.createPatientAppointmentObject(integration, report.schedule),
      ),
    );
    const schedules = await this.appointmentService.transformSchedules(integration, reportSchedules);
    const schedulesMap = schedules.reduce((acc, schedule) => {
      acc[schedule.appointmentCode] = schedule;
      return acc;
    }, {});

    const reportScheduleGrouped: { [key: string]: ReportSending } = reports.reduce((acc, el) => {
      const id = `${el.groupScheduleCode}-${el.modality}`;
      if (!acc[id]) {
        acc[id] = el;
      } else if (moment(el.scheduleDate).isBefore(acc[id].scheduleDate)) {
        acc[id] = el;
      }
      return acc;
    }, {});

    const linksData = Object.values(reportScheduleGrouped).map((report) => {
      const downloadMedicalReportLink = this.schedulingDownloadReportService.createDownloadMedicalReportLink(
        castObjectIdToString(integration._id),
        validPatient.patientCode,
        validPatient.shortId,
        report.scheduleCode,
        report.id,
        report.modality,
        null,
        true,
      );

      return {
        link: downloadMedicalReportLink,
        groupScheduleCode: report.groupScheduleCode,
        modality: report.modality,
      };
    });

    const result: { [key: string]: AvailableMedicalReportsByScheduleCode } = {};

    const sortedReports = reports.sort((a, b) => moment(a.scheduleDate).valueOf() - moment(b.scheduleDate).valueOf());

    sortedReports.forEach((el) => {
      if (result[el.groupScheduleCode]) {
        result[el.groupScheduleCode].procedureName =
          `${result[el.groupScheduleCode].procedureName} / ${schedulesMap?.[el.scheduleCode]?.procedure?.friendlyName}`;
      } else {
        result[el.groupScheduleCode] = {
          procedureName: schedulesMap?.[el.scheduleCode]?.procedure?.friendlyName,
          scheduleCode: el.scheduleCode,
          scheduleDate: el.scheduleDate,
          groupScheduleCode: el.groupScheduleCode,
          reportLinks: [],
        };
      }
    });

    linksData.map((el) => {
      result[el.groupScheduleCode].reportLinks.push({
        modality: el.modality,
        link: el.link,
      });
    });

    return {
      count: Object.values(result).length,
      data: [
        {
          patientName: reports[0]?.patientName,
          schedulings: Object.values(result),
        },
      ],
    };
  }

  public async hasAvailableMedicalReports(
    integration: IntegrationDocument,
    _: ListSchedules,
    filter: HasAvailableMedicalReportsFilterRequest,
  ): Promise<HasAvailableMedicalReportsFilterResponse> {
    try {
      const payload: ListReportSending = {
        params: { scheduleCode: filter.scheduleCode },
      };
      const reports = (await this.botdesignerApiService.listReportSending(
        integration,
        payload,
      )) as unknown as ReportSending[];
      return { ok: !!reports?.length };
    } catch (error) {
      console.error(error);
      return { ok: false };
    }
  }

  public async downloadMedicalReport(
    integration: IntegrationDocument,
    data: DownloadMedicalReportTokenData,
  ): Promise<Buffer> {
    try {
      if (!data.medicalReportCode || !(data.scheduleCode && data.medicalReportExamCode)) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'required id, schedule code or modality', undefined, true);
      }
      const { url } = await this.botdesignerApiService.getReportSendingUrl(integration, {
        params: {
          scheduleCode: data.scheduleCode,
        },
      });
      const bufferFile: Buffer = await this.botdesignerApiService.downloadS3File(integration, url);
      await this.botdesignerApiService.updateReportSending(integration, {
        params: {
          type: UpdateReportSendingType.DOWNLOADED,
          valuesToUpdate: [data.patientErpCode],
        },
      });
      return bufferFile;
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async getMedicalReportUrl(
    integration: IntegrationDocument,
    data: DownloadMedicalReportTokenData,
  ): Promise<string> {
    try {
      if (!data.scheduleCode) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'schedule code', undefined, true);
      }
      const { url } = await this.botdesignerApiService.getReportSendingUrl(integration, {
        params: {
          scheduleCode: data.scheduleCode,
        },
      });
      return url;
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async validatePatientReportDownload(
    integration: IntegrationDocument,
    body: ValidPatientReportDownloadRequest,
  ): Promise<boolean> {
    const patientData = await this.getPatient(integration, { code: body.patientCode });

    if (!patientData) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
    }

    const patientDataBirthDate = moment(patientData?.bornDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
    const dataBirthDate = moment(body?.patientBirthDate, 'DD/MM/YYYY').format('YYYY-MM-DD');

    if (body.patientCpf !== patientData.cpf || dataBirthDate !== patientDataBirthDate) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Patient Cpf or BornDate is a mismatch',
        undefined,
        true,
      );
    }

    const hasValidMotherName = !patientData?.motherName || body?.patientMotherName === patientData?.motherName;

    if (hasValidMotherName) {
      return true;
    }

    throw HTTP_ERROR_THROWER(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Mothers Name or Schedule Code is a mismatch',
      undefined,
      true,
    );
  }

  async listSuggestedDoctors(
    integration: IntegrationDocument,
    filter: ListSuggestedDoctors,
  ): Promise<DoctorEntityDocument[]> {
    try {
      const data = await this.botdesignerApiService.listSuggestedDoctors(integration, {
        params: {
          patientCode: filter.patientCode,
        },
      });

      const doctorCodes = data?.map(({ code }) => code);

      if (!doctorCodes?.length) {
        return [];
      }

      return await this.entitiesService.getModel(EntityType.doctor).find({
        integrationId: castObjectId(integration._id),
        code: { $in: doctorCodes },
        activeErp: true,
        canView: true,
      });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.listSuggestedDoctors', error);
    }
  }

  async agentUploadScheduleFile(integration: IntegrationDocument, data: AgentUploadFile): Promise<OkResponse> {
    try {
      const payload: AgentUploadScheduleFile = {
        data: {
          appointmentTypeCode: data.appointmentTypeCode,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileTypeCode: data.fileTypeCode,
          patientCode: data.patientCode,
          erpUsername: data.erpUsername,
          scheduleCode: data.scheduleCode,
          extension: data.extension,
          hash: data.hash,
          mimeType: data.mimeType,
        },
      };

      return await this.botdesignerApiService.agentUploadScheduleFile(integration, payload);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.agentUploadScheduleFile', error);
    }
  }

  async patientUploadScheduleFile(integration: IntegrationDocument, data: PatientUploadFile): Promise<OkResponse> {
    try {
      const payload: PatientUploadScheduleFile = {
        data: {
          appointmentTypeCode: data.appointmentTypeCode,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileTypeCode: data.fileTypeCode,
          patientCode: data.patientCode,
          scheduleCode: data.scheduleCode,
          extension: data.extension,
          hash: data.hash,
          mimeType: data.mimeType,
        },
      };

      return await this.botdesignerApiService.patientUploadScheduleFile(integration, payload);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.patientUploadScheduleFile', error);
    }
  }

  async patientDeleteScheduleFile(integration: IntegrationDocument, data: PatientDeleteFile): Promise<OkResponse> {
    try {
      const payload: PatientDeleteScheduleFile = {
        data: {
          appointmentTypeCode: data.appointmentTypeCode,
          fileName: data.fileName,
          fileTypeCode: data.fileTypeCode,
          patientCode: data.patientCode,
          scheduleCode: data.scheduleCode,
          hash: data.hash,
        },
      };

      return await this.botdesignerApiService.patientDeleteScheduleFile(integration, payload);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.patientDeleteScheduleFile', error);
    }
  }

  async agentDeleteScheduleFile(integration: IntegrationDocument, data: AgentUploadFile): Promise<OkResponse> {
    try {
      const payload: AgentDeleteScheduleFile = {
        data: {
          appointmentTypeCode: data.appointmentTypeCode,
          fileName: data.fileName,
          erpUsername: data.erpUsername,
          fileTypeCode: data.fileTypeCode,
          patientCode: data.patientCode,
          scheduleCode: data.scheduleCode,
          hash: data.hash,
        },
      };

      return await this.botdesignerApiService.agentDeleteScheduleFile(integration, payload);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.agentDeleteScheduleFile', error);
    }
  }

  async listFileTypesToUpload(integration: IntegrationDocument): Promise<ListFileTypesResponse> {
    try {
      return await this.botdesignerApiService.listFileTypesToUpload(integration);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerService.listFileTypesToUpload', error);
    }
  }

  async listSchedulesToActiveSending(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    return await this.botdesignerConfirmationService.listSchedulesToActiveSending(integration, data);
  }
}
