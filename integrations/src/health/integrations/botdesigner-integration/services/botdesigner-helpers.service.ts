import { Injectable, Logger } from '@nestjs/common';
import { IIntegration } from '../../../integration/interfaces/integration.interface';
import {
  AvailableSchedule,
  Patient as BotdesignerPatient,
  DoctorEntity,
  PatientSchedule,
  ScheduleStatus,
} from 'kissbot-health-core';
import { Patient } from '../../../interfaces/patient.interface';
import { onlyNumbers } from '../../../../common/helpers/format-cpf';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { EntityDocument, TypeOfService } from '../../../entities/schema';
import { Types } from 'mongoose';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { EntityType, IDoctorEntity, SpecialityTypes } from '../../../interfaces/entity.interface';
import { ListAvailableSchedules } from '../../../integrator/interfaces';
import { FlowService } from '../../../flow/service/flow.service';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { BotdesignerEntitiesService } from './botdesigner-entities.service';

interface CompositeProcedureCodeData {
  code: string;
  areaCode?: string;
  lateralityCode?: string;
  specialityCode?: string;
  specialityType?: string;
}

interface CompositeSpecialityCodeData {
  code: string;
  specialityType?: string;
}

interface CompositeSubPlanCodeData {
  code: string;
  insurancePlanCode?: string;
  insuranceCode?: string;
}

@Injectable()
export class BotdesignerHelpersService {
  private readonly logger = new Logger(BotdesignerHelpersService.name);

  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly flowService: FlowService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly botdesignerEntitiesService: BotdesignerEntitiesService,
  ) {}

  private getCompositeProcedureIdentifiers(): string[] {
    return ['c', 's', 'st', 'a', 'l'];
  }

  private getCompositeSpecialityIdentifiers(): string[] {
    return ['c', 'st'];
  }

  private getCompositeSubPlanIdentifiers(): string[] {
    return ['c', 's', 'i'];
  }

  private getCompositePlanCategoryIdentifiers(): string[] {
    return ['c', 'i'];
  }

  private getCompositePlanIdentifiers(): string[] {
    return ['c', 'i'];
  }

  public createCompositeProcedureCode(
    _: IIntegration,
    code: string,
    specialityCode: string,
    specialityType: string,
    areaCode: string,
    lateralityCode: string,
  ): string {
    const [i0, i1, i2, i3, i4] = this.getCompositeProcedureIdentifiers();

    const pCode = `${code}`;
    const aCode = areaCode ? `${areaCode}` : '';
    const lCode = lateralityCode ? `${lateralityCode}` : '';
    const sCode = specialityCode ? `${specialityCode}` : '';
    const sType = specialityType ? `${specialityType}` : '';

    return `${i0}${pCode}:${i1}${sCode}:${i2}${sType}:${i3}${aCode}:${i4}${lCode}`;
  }

  public getCompositeProcedureCode(_: IIntegration, code = ''): CompositeProcedureCodeData {
    const identifiers = this.getCompositeProcedureIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      specialityCode: parts?.[1],
      specialityType: parts?.[2],
      areaCode: parts?.[3],
      lateralityCode: parts?.[4],
    };
  }

  public createCompositeSpecialityCode(_: IIntegration, code: string, specialityType: string): string {
    const [i0, i1] = this.getCompositeSpecialityIdentifiers();

    const sCode = `${code}`;
    const sType = specialityType ? `${specialityType}` : '';

    return `${i0}${sCode}:${i1}${sType}`;
  }

  public getCompositeSpecialityCode(_: IIntegration, code = ''): CompositeSpecialityCodeData {
    const identifiers = this.getCompositeSpecialityIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      specialityType: parts?.[1],
    };
  }

  public createCompositeSubPlanCode(
    _: IIntegration,
    code: string,
    insurancePlanCode: string,
    insuranceCode: string,
  ): string {
    const [i0, i1, i2] = this.getCompositeSubPlanIdentifiers();

    const subPlanCode = `${code}`;
    const planCode = insurancePlanCode ? `${insurancePlanCode}` : '';
    const insCode = insuranceCode ? `${insuranceCode}` : '';

    return `${i0}${subPlanCode}:${i1}${planCode}:${i2}${insCode}`;
  }

  public getCompositePlanCategoryCode(_: IIntegration, code = ''): CompositeSubPlanCodeData {
    const identifiers = this.getCompositePlanCategoryIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      insuranceCode: parts?.[1],
    };
  }

  public createCompositePlanCategoryCode(_: IIntegration, code: string, insuranceCode: string): string {
    const [i0, i1] = this.getCompositePlanCategoryIdentifiers();

    const categoryCode = `${code}`;
    const insCode = insuranceCode ? `${insuranceCode}` : '';

    return `${i0}${categoryCode}:${i1}${insCode}`;
  }

  public getCompositeSubPlanCode(_: IIntegration, code = ''): CompositeSubPlanCodeData {
    const identifiers = this.getCompositeSubPlanIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      insurancePlanCode: parts?.[1],
      insuranceCode: parts?.[2],
    };
  }

  public createCompositePlanCode(_: IIntegration, code: string, insuranceCode: string): string {
    const [i0, i1] = this.getCompositePlanIdentifiers();

    const planCode = `${code}`;
    const insCode = insuranceCode ? `${insuranceCode}` : '';

    return `${i0}${planCode}:${i1}${insCode}`;
  }

  public getCompositePlanCode(_: IIntegration, code = ''): CompositeSubPlanCodeData {
    const identifiers = this.getCompositePlanIdentifiers();
    const parts = code?.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      insuranceCode: parts?.[1],
    };
  }

  public replaceBotdesignerPatientToPatient(botdesignerPatient: BotdesignerPatient): Patient {
    const patient: Patient = {
      bornDate: botdesignerPatient.bornDate,
      name: botdesignerPatient.name,
      cpf: onlyNumbers(botdesignerPatient.cpf),
      sex: botdesignerPatient.sex,
      code: String(botdesignerPatient.code),
      cellPhone: botdesignerPatient.cellPhone,
      email: botdesignerPatient.email,
      phone: botdesignerPatient.phone,
    };

    return patient;
  }

  private getIsFollowUp(typeOfServiceCode: string): boolean {
    return typeOfServiceCode === 'R';
  }

  private getBotdesignerScheduleStatus(appointment: PatientSchedule): AppointmentStatus {
    switch (appointment.scheduleStatus) {
      case ScheduleStatus.confirmed:
        return AppointmentStatus.confirmed;

      case ScheduleStatus.scheduled:
        return AppointmentStatus.scheduled;

      case ScheduleStatus.canceled:
        return AppointmentStatus.canceled;

      case ScheduleStatus.finished:
        return AppointmentStatus.finished;

      default:
        return AppointmentStatus.scheduled;
    }
  }

  public async setExternalDoctorsEntityAndCacheIt(integration: IntegrationDocument): Promise<void> {
    if (!integration?.showExternalEntities?.includes(EntityType.doctor)) {
      // Se a integração permite entidades externas, não busca entidades internas
      return;
    }

    let allExternalEntities = await this.integrationCacheUtilsService.getCacheExternalEntities(
      integration,
      EntityType.doctor,
    );

    if (!allExternalEntities) {
      allExternalEntities = await this.botdesignerEntitiesService.listDoctors(integration, null);

      if (allExternalEntities.length !== 0) {
        await this.integrationCacheUtilsService.setCacheExternalEntities(
          integration,
          EntityType.doctor,
          allExternalEntities?.map((entity) => ({ ...entity, virtual: true })),
        );
      }
    }
  }

  public async getExternalDoctorsEntityAndCacheIt(integration: IntegrationDocument): Promise<IDoctorEntity[]> {
    if (!integration?.showExternalEntities?.includes(EntityType.doctor)) {
      // Se a integração permite entidades externas, não busca entidades internas
      return [];
    }

    return await this.integrationCacheUtilsService.getCacheExternalEntities(integration, EntityType.doctor);
  }

  private buildScheduleObject(
    botdesignerSchedule: AvailableSchedule,
    filter: CorrelationFilter,
    doctor: IDoctorEntity,
  ) {
    const schedule: RawAppointment = {
      appointmentTypeId: filter.appointmentType.code,
      insuranceId: botdesignerSchedule.insuranceCode,
      appointmentCode: String(botdesignerSchedule.scheduleCode),
      duration: String(botdesignerSchedule.duration),
      appointmentDate: botdesignerSchedule.scheduleDate,
      status: AppointmentStatus.scheduled,
      doctorId: botdesignerSchedule.doctorCode,
      organizationUnitId: botdesignerSchedule.organizationUnitCode,
      specialityId: botdesignerSchedule.specialityCode,
      typeOfServiceId: botdesignerSchedule.typeOfServiceCode,
      occupationAreaId: botdesignerSchedule.occupationAreaCode,
      organizationUnitAdress: botdesignerSchedule.data?.endereco || undefined,
    };

    try {
      const defaultData: Partial<EntityDocument> = {
        canSchedule: true,
        canReschedule: true,
        canCancel: true,
        canConfirmActive: true,
        canConfirmPassive: true,
        canView: true,
      };

      // cria um médico padrão
      if (botdesignerSchedule?.doctorCode) {
        schedule.doctorDefault = {
          code: String(botdesignerSchedule.doctorCode),
          name: doctor?.name || String('Médico'),
          friendlyName: doctor?.name || String('Médico'),
          ...defaultData,
        } as Partial<DoctorEntity>;
      }

      return schedule;
    } catch (err) {
      this.logger.error('BotdesignerHelpersService.createAvailableScheduleObject', err);
    }
  }

  public async createAvailableScheduleObject(
    integration: IntegrationDocument,
    botdesignerSchedule: AvailableSchedule,
    availableSchedules: ListAvailableSchedules,
    validExternalDoctorsMap: { [key: string]: IDoctorEntity } = {},
    validInternalDoctorsMap: { [key: string]: IDoctorEntity } = {},
  ): Promise<RawAppointment> {
    const { filter } = availableSchedules;

    try {
      if (filter?.appointmentType?.code === SpecialityTypes.E) {
        return this.buildScheduleObject(botdesignerSchedule, filter, null);
      }

      const matchedExternalDoctor = validExternalDoctorsMap?.[botdesignerSchedule.doctorCode];
      const matchedInternalDoctor = validInternalDoctorsMap?.[botdesignerSchedule.doctorCode];

      const activeExternalDoctorRule = !!integration.showExternalEntities?.find(
        (externalEntity) => externalEntity === EntityType.doctor,
      );

      if (!matchedExternalDoctor && !matchedInternalDoctor) {
        return null;
      }

      const doctor = matchedInternalDoctor || matchedExternalDoctor;
      const internalDoctorIsActive = matchedInternalDoctor?.canView && matchedInternalDoctor?.canSchedule;

      // Caso o médico esteja ativo no banco de dados
      if (!activeExternalDoctorRule && internalDoctorIsActive && matchedInternalDoctor?.activeErp) {
        return this.buildScheduleObject(botdesignerSchedule, filter, doctor);
      }

      // Caso o médico esteja inativado no banco de dados
      if (!activeExternalDoctorRule && (!internalDoctorIsActive || !matchedInternalDoctor?.activeErp)) {
        return null;
      }

      // Se a regra de mostrar entidades externas está ativa mas o médico está ativo do nosso lado com a flag canView = false
      // não vai exibir
      if (activeExternalDoctorRule && internalDoctorIsActive && matchedInternalDoctor?.activeErp) {
        return this.buildScheduleObject(botdesignerSchedule, filter, doctor);
      }

      if (activeExternalDoctorRule && !internalDoctorIsActive && !matchedExternalDoctor?.virtual) {
        return null;
      }

      // Se o médico internamente for inativo no erp mas a regra de externos está ativa e o médico retornou como virtual
      // então builda o horário pois na logica anterior foi verificado se ele era importado como canview=false
      if (activeExternalDoctorRule && !matchedInternalDoctor?.activeErp && matchedExternalDoctor?.virtual) {
        return this.buildScheduleObject(botdesignerSchedule, filter, doctor);
      }

      // Analisa pela propriedade de virtual para saber se é um médico que retornou em tempo de execução da integração
      // e se activeExternalDoctorRule está ativo pode retornar este médico externo para retornar o horário dele
      if (activeExternalDoctorRule && !internalDoctorIsActive && matchedExternalDoctor?.virtual) {
        return null;
      }

      if (activeExternalDoctorRule && matchedExternalDoctor?.virtual) {
        return this.buildScheduleObject(botdesignerSchedule, filter, doctor);
      }

      return null;
    } catch (error) {
      console.error(error);
    }

    return null;
  }

  public async createPatientAppointmentObject(
    integration: IntegrationDocument,
    appointment: PatientSchedule,
  ): Promise<RawAppointment> {
    const procedureCode = this.createCompositeProcedureCode(
      integration,
      appointment.procedureCode,
      appointment.specialityCode,
      appointment.appointmentTypeCode,
      null,
      appointment.handedness || this.getHandedness(integration._id),
    );

    const specialityCode = this.createCompositeSpecialityCode(
      integration,
      appointment.specialityCode,
      appointment.appointmentTypeCode,
    );

    const schedule: RawAppointment = {
      appointmentCode: String(appointment.scheduleCode),
      appointmentDate: appointment.scheduleDate,
      status: this.getBotdesignerScheduleStatus(appointment),
      duration: '0',
      appointmentTypeId: appointment.appointmentTypeCode,
      doctorId: appointment.doctorCode,
      insuranceId: appointment.insuranceCode,
      insurancePlanId: appointment.insurancePlanCode,
      insuranceSubPlanId: appointment.insurancePlanCode,
      planCategoryId: appointment.insuranceCategoryCode,
      procedureId: procedureCode,
      organizationUnitId: appointment.organizationUnitCode,
      specialityId: specialityCode,
      typeOfServiceId: appointment.typeOfServiceCode,
      guidance: appointment.guidance,
      observation: appointment.observation,
      isFollowUp: this.getIsFollowUp(appointment.typeOfServiceCode),
      organizationUnitAdress: appointment.organizationUnitAddress,
      organizationUnitLocationId: appointment.organizationUnitLocationCode,
      occupationAreaId: appointment.occupationAreaCode,
      data: {
        appointmentTypeCode: appointment.appointmentTypeCode,
      },
    };

    return schedule;
  }

  public typeOfServiceToBotdesignerTypeOfService(type: TypeOfService): string {
    return {
      [TypeOfService.followUp]: 'R',
    }[type];
  }

  public getHandedness(integrationId: Types.ObjectId): string {
    // Temporário para unimed tubarão, dona helena, bluimagem lateralidade
    return ['64dbc11168d29200082474fe', '64d28fbc4942f5000830ada4', '663984c8713cc3dac0200394'].includes(
      castObjectIdToString(integrationId),
    )
      ? 'N'
      : null;
  }
}
