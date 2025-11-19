import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { IntegrationService } from '../../integration/integration.service';
import { IntegratorService } from '../../integrator/service/integrator.service';
import { ListSchedulesResumeResponse, ScheduleStatus } from '../interfaces/schedule-resume.interface';
import * as jwt from 'jsonwebtoken';
import { DownloadTokenData } from '../interfaces/download-token.interface';
import { SchedulingGuidanceFormat } from '../../integration/interfaces/integration.interface';
import { ConfirmSchedule } from '../interfaces/confirm-schedule.interface';
import { CancelSchedule } from '../interfaces/cancel-schedule.interface';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { ListingType, ListSchedules } from '../interfaces/list-schedules.interface';
import * as moment from 'moment';
import { SchedulingTransformerService } from './scheduling.transformer.service';
import { SchedulingSettings } from '../interfaces/get-settings.interface';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from '../../../common/exceptions.service';
import { SchedulingLinksService } from './scheduling-links.service';
import { SchedulingDownloadReportService } from './scheduling-download-report.service';
import { ConfirmationScheduleDataEmail } from '../interfaces/confirmation-schedule-data-email.interface';
import { SchedulingCacheService } from './cache-service/scheduling-cache.service';
import { EntityType } from 'health/interfaces/entity.interface';
import { SchedulingEntitiesService } from './scheduling-entities.service';
import {
  ListAppointmentType,
  ListDoctor,
  ListInsurance,
  ListInsurancePlan,
  ListInsuranceSubPlan,
  ListOccupationArea,
  ListOrganizationUnit,
  ListOrganizationUnitLocation,
  ListPlanCategory,
  ListProcedure,
  ListSpeciality,
  ListTypeOfService,
} from '../interfaces/entities-filters.interface';
import {
  AppointmentTypeOutput,
  DoctorOutput,
  InsuranceOutput,
  InsurancePlanOutput,
  InsuranceSubPlanOutput,
  OccupationAreaOutput,
  OrganizationUnitOutput,
  PlanCategoryOutput,
  ProcedureOutput,
  SpecialityOutput,
  TypeOfServiceOutput,
} from '../interfaces/entities-output.interface';
import {
  AppointmentTypeEntityDocument,
  DoctorEntityDocument,
  InsuranceEntityDocument,
  InsurancePlanEntityDocument,
  InsuranceSubPlanEntityDocument,
  OccupationAreaEntityDocument,
  OrganizationUnitEntityDocument,
  OrganizationUnitLocationEntityDocument,
  PlanCategoryEntityDocument,
  ProcedureEntityDocument,
  SpecialityEntityDocument,
  TypeOfServiceEntityDocument,
} from 'health/entities/schema';
import { SchedulingDocumentsService } from './scheduling-documents.service';
import { AppointmentStatus } from '../../interfaces/appointment.interface';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly integratorService: IntegratorService,
    private readonly transformerService: SchedulingTransformerService,
    private readonly schedulingLinksService: SchedulingLinksService,
    private readonly schedulingCacheService: SchedulingCacheService,
    private readonly schedulingDownloadReportService: SchedulingDownloadReportService,
    private readonly schedulingEntitiesService: SchedulingEntitiesService,
    private readonly schedulingDocumentsService: SchedulingDocumentsService,
  ) {}

  public async downloadGuidance(integrationId: string, data: DownloadTokenData): Promise<Buffer> {
    return await this.integratorService.downloadDocument(integrationId, {
      patientCode: data.patientErpCode,
      scheduleCode: data.scheduleCode,
      type: 'guidance',
    });
  }

  public async getAccessTokenAndRedirect(
    shortId: string,
    data: ConfirmationScheduleDataEmail,
  ): Promise<{ token: string; link: string }> {
    const schedulingLink = await this.schedulingLinksService.getScheduleByShortId(shortId);

    if (!schedulingLink) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    const { integrationId, patientErpCode } = schedulingLink;

    const token = jwt.sign(
      {
        data,
        integrationId,
        patientErpCode,
        url: process.env.INTEGRATIONS_URL,
        shortId,
      },
      process.env.SCHEDULING_JWT_SECRET_KEY,
      {
        expiresIn: '3 days',
      },
    );

    return { token, link: schedulingLink.link };
  }

  public async listAppointmentType(integrationId: string, data: ListAppointmentType): Promise<AppointmentTypeOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.appointmentType,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const appointmentType = entity as AppointmentTypeEntityDocument[];

      return this.schedulingEntitiesService.formatAppointmentTypeOutput(appointmentType);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listAppointmentType`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listDoctor(integrationId: string, data: ListDoctor): Promise<DoctorOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.doctor,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const doctor = entity as DoctorEntityDocument[];

      return this.schedulingEntitiesService.formatDoctorOutput(doctor);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listDoctor`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listInsurance(integrationId: string, data: ListInsurance): Promise<InsuranceOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.insurance,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const insurance = entity as InsuranceEntityDocument[];

      return this.schedulingEntitiesService.formatInsuranceOutput(insurance);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listInsurance`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listInsurancePlan(integrationId: string, data: ListInsurancePlan): Promise<InsurancePlanOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.insurancePlan,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const insurancePlan = entity as InsurancePlanEntityDocument[];

      return this.schedulingEntitiesService.formatInsurancePlanOutput(insurancePlan);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listInsurancePlan`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listInsuranceSubPlan(
    integrationId: string,
    data: ListInsuranceSubPlan,
  ): Promise<InsuranceSubPlanOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.insuranceSubPlan,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const insuranceSubPlan = entity as InsuranceSubPlanEntityDocument[];

      return this.schedulingEntitiesService.formatInsuranceSubplanOutput(insuranceSubPlan);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listInsuranceSubplan`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listOccupationArea(integrationId: string, data: ListOccupationArea): Promise<OccupationAreaOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.occupationArea,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const occupationArea = entity as OccupationAreaEntityDocument[];

      return this.schedulingEntitiesService.formatOccupationAreaOutput(occupationArea);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listOccupationArea`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listOrganizationUnit(
    integrationId: string,
    data: ListOrganizationUnit,
  ): Promise<OrganizationUnitOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.organizationUnit,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const organizationUnit = entity as OrganizationUnitEntityDocument[];

      return this.schedulingEntitiesService.formatOrganizationUnitOutput(organizationUnit);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listOrganizationUnit`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listOrganizationUnitLocation(
    integrationId: string,
    data: ListOrganizationUnitLocation,
  ): Promise<OrganizationUnitOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.organizationUnitLocation,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const organizationUnitLocation = entity as OrganizationUnitLocationEntityDocument[];

      return this.schedulingEntitiesService.formatOrganizationUnitLocationOutput(organizationUnitLocation);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listOrganizationUnitLocation`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listPlanCategory(integrationId: string, data: ListPlanCategory): Promise<PlanCategoryOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.planCategory,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const planCategory = entity as PlanCategoryEntityDocument[];

      return this.schedulingEntitiesService.formatPlanCategoryOutput(planCategory);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listPlanCategory`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listProcedure(integrationId: string, data: ListProcedure): Promise<ProcedureOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.procedure,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const procedure = entity as ProcedureEntityDocument[];

      return this.schedulingEntitiesService.formatProcedureOutput(procedure);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listProcedure`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listSpeciality(integrationId: string, data: ListSpeciality): Promise<SpecialityOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.speciality,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const speciality = entity as SpecialityEntityDocument[];

      return this.schedulingEntitiesService.formatSpecialityOutput(speciality);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listSpeciality`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listTypeOfService(integrationId: string, data: ListTypeOfService): Promise<TypeOfServiceOutput[]> {
    try {
      const entityList = {
        targetEntity: EntityType.typeOfService,
        filter: data,
        cache: true,
      };

      const { data: entity } = await this.integratorService.getEntityListV2(integrationId, entityList);
      const typeOfService = entity as TypeOfServiceEntityDocument[];

      return this.schedulingEntitiesService.formatTypeOfServiceOutput(typeOfService);
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING:${integrationId}:listTypeOfService`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return [];
    }
  }

  public async listSchedules(integrationId: string, data: ListSchedules): Promise<ListSchedulesResumeResponse> {
    const cachedSchedules = await this.schedulingCacheService.getScheduleCache(
      `${integrationId}-${data.patientErpCode}`,
    );

    if (cachedSchedules?.schedules?.length && data.scheduleCode) {
      const schedules = cachedSchedules.schedules.filter((schedule) => schedule.scheduleCode === data.scheduleCode);

      return {
        ...cachedSchedules,
        schedules,
      };
    }

    const { patientErpCode, patientCpf } = await this.schedulingLinksService.getScheduleByShortId(data.shortId);

    const patientSchedules = {
      patientCode: patientErpCode,
      startDate: data?.scheduleCode ? null : moment().valueOf(),
      returnGuidance: true,
      ignoreFlowExecution: true,
    };

    if (data.listingType === ListingType.All) {
      patientSchedules.startDate = moment().subtract(60, 'days').valueOf();
    }

    const [nextSchedules, patient] = await Promise.all([
      this.integratorService.getPatientSchedules(integrationId, patientSchedules),
      this.integratorService.getPatient(
        integrationId,
        {
          code: patientErpCode,
          cpf: patientCpf,
        },
        true,
      ),
    ]);

    const integration = await this.integrationService.getOne(integrationId);
    const createDownloadLinks = integration.scheduling?.guidanceFormatType === SchedulingGuidanceFormat.file;
    const enabledDocumentsUpload = integration.scheduling?.config?.documents?.enableDocumentsUpload;

    const response: ListSchedulesResumeResponse = {
      defaultGuidanceLink: null,
      guidanceType: integration.scheduling?.guidanceFormatType || null,
      patientFirstName: patient?.name ? String(patient?.name).trim()?.split(' ')?.[0] : null,
      schedules: [],
    };

    const validSchedules = [];

    if (data.scheduleCode) {
      validSchedules.push(...nextSchedules.filter((schedule) => schedule.appointmentCode === data.scheduleCode));
    } else {
      validSchedules.push(...nextSchedules);
    }

    response.schedules = await Promise.all(
      validSchedules.map(async (schedule) => {
        const documentsSendedCount = enabledDocumentsUpload
          ? await this.schedulingDocumentsService.getDocumentsCountForSchedule(integrationId, schedule.appointmentCode)
          : undefined;

        return {
          ...this.transformerService.transformPatientSchedule(integration, schedule),
          guidanceLink: createDownloadLinks
            ? this.schedulingDownloadReportService.createProcedureGuidanceDownloadLink(
                integration._id,
                data.patientErpCode,
                data.shortId,
                schedule.appointmentCode,
              )
            : undefined,
          documentsSendedCount,
        };
      }),
    );

    if (createDownloadLinks) {
      const defaultDownloadLink = this.schedulingDownloadReportService.createProcedureGuidanceDownloadLink(
        integration._id,
        data.patientErpCode,
        data.shortId,
      );
      response.defaultGuidanceLink = defaultDownloadLink;
    }

    try {
      if (response.schedules?.length && !data.scheduleCode) {
        await this.schedulingCacheService.setScheduleCache(`${integrationId}-${data.patientErpCode}`, response);
      }
    } catch (error) {}

    return response;
  }

  public async confirmSchedule(
    integrationId: string,
    { patientErpCode, scheduleCode, scheduleId }: ConfirmSchedule,
  ): Promise<OkResponse> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration.scheduling?.config?.resources?.confirmation?.enableScheduleConfirmation) {
      return { ok: false, message: 'Recurso não habilitado' };
    }

    try {
      const okResponse = await this.integratorService.confirmScheduleV2(integrationId, {
        scheduleId,
        scheduleCode,
      });

      try {
        if (okResponse?.ok) {
          const listSchedules = await this.schedulingCacheService.getScheduleCache(
            `${integrationId}-${patientErpCode}`,
          );

          if (!listSchedules?.schedules?.length) {
            return;
          }

          listSchedules.schedules = listSchedules.schedules.map((schedule) => {
            if (schedule.scheduleCode === scheduleCode) {
              schedule.status = ScheduleStatus.confirmed;
            }

            return schedule;
          });
          await this.schedulingCacheService.setScheduleCache(`${integrationId}-${patientErpCode}`, listSchedules);
        }
      } catch (error) {}

      return okResponse;
    } catch (error) {
      if (error?.status === HttpStatus.CONFLICT) {
        return error;
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        { ok: false, message: 'Ocorreu um erro ao confirmar o agendamento. Tente novamente mais tarde.' },
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelSchedule(
    integrationId: string,
    { patientErpCode, scheduleCode, scheduleId }: CancelSchedule,
  ): Promise<OkResponse> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration.scheduling?.config?.resources?.cancellation?.enableScheduleCancellation) {
      return { ok: false, message: 'Recurso não habilitado' };
    }

    try {
      const okResponse = await this.integratorService.cancelScheduleV2(integrationId, {
        scheduleId,
        scheduleCode,
      });

      try {
        if (okResponse?.ok) {
          const listSchedules = await this.schedulingCacheService.getScheduleCache(
            `${integrationId}-${patientErpCode}`,
          );

          if (!listSchedules?.schedules?.length) {
            return;
          }

          listSchedules.schedules = listSchedules.schedules.filter(
            (schedule) => schedule.scheduleCode !== scheduleCode,
          );
          await this.schedulingCacheService.setScheduleCache(`${integrationId}-${patientErpCode}`, listSchedules);
        }
      } catch (error) {}

      return okResponse;
    } catch (error) {
      if (error?.status === HttpStatus.CONFLICT) {
        return error;
      }
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        { ok: false, message: 'Ocorreu um erro ao cancelar o agendamento. Tente novamente mais tarde.' },
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getSettings(integrationId: string): Promise<SchedulingSettings> {
    const integration = await this.integrationService.getOne(integrationId);
    return integration?.scheduling?.config || null;
  }
}
