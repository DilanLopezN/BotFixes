import { Injectable, Logger } from '@nestjs/common';
import {
  AppointmentTypeEntity,
  ScheduleType,
  EntityDocument,
  ProcedureEntity,
  SpecialityEntity,
  OrganizationUnitEntityDocument,
} from '../../../entities/schema';
import { onlyNumbers } from '../../../../common/helpers/format-cpf';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import { ManagerPatientPhoneType, ManagerPatientResponse, ManagerPatientSchedulesResponse } from '../interfaces';
import * as moment from 'moment';
import { CacheService } from '../../../../core/cache/cache.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class ManagerHelpersService {
  private readonly logger = new Logger(ManagerHelpersService.name);
  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly cacheService: CacheService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  public async createPatientAppointmentObject(
    integration: IntegrationDocument,
    appointment: ManagerPatientSchedulesResponse,
  ): Promise<RawAppointment> {
    const schedule: RawAppointment = {
      appointmentCode: String(appointment.handle),
      appointmentDate: appointment.data,
      status: AppointmentStatus.scheduled,
      duration: '0',
      // @TODO: indentificar como saber se devo retornar recurso ou medico
      doctorId: String(appointment.recurso?.handle || appointment.medico?.handle),
      insuranceId: String(appointment.convenio?.handle),
      procedureId: String(appointment.servico?.handle),
      specialityId: String(appointment.especialidade?.handle),
      appointmentTypeId: String(appointment.servico?.tipo),
      canCancel: false,
      canConfirm: false,
    };

    if (appointment.unidadeFilial?.handle) {
      schedule.organizationUnitId = String(appointment.unidadeFilial?.handle);
    } else {
      try {
        const organizationUnits = await this.entitiesService.getValidEntities(
          EntityType.organizationUnit,
          integration._id,
        );

        if (organizationUnits.length === 1) {
          schedule.organizationUnit = organizationUnits[0];
        }
      } catch (err) {
        this.logger.error('ManagerHelpersService.createPatientApointmentObject.units', err);
      }
    }

    if (appointment.confirmacaoDisponivel === 'DISPONIVEL') {
      schedule.canConfirm = true;
    } else if (appointment.confirmacaoDisponivel === 'CONFIRMADO') {
      schedule.status = AppointmentStatus.confirmed;
    }

    if (appointment.cancelamentoDisponivel) {
      schedule.canCancel = true;
    }

    try {
      const defaultData: Partial<EntityDocument> = {
        canSchedule: false,
        canReschedule: false,
        canCancel: true,
        canConfirmActive: false,
        canConfirmPassive: true,
        canView: true,
      };

      if (appointment.servico?.handle) {
        schedule.procedureDefault = {
          code: String(appointment.servico.handle),
          name: String(appointment.servico.nome),
          friendlyName: String(appointment.servico.nome),
          specialityType: appointment.servico?.tipo,
          ...defaultData,
        } as Partial<ProcedureEntity>;
      }

      if (appointment.unidadeFilial?.handle) {
        schedule.organizationUnitDefault = {
          code: String(appointment.unidadeFilial.handle),
          name: appointment.unidadeFilial.nome,
          friendlyName: appointment.unidadeFilial.nome,
          ...defaultData,
        };
      }

      if (appointment.especialidade?.handle) {
        const specialityCode = String(appointment.especialidade.handle);
        const specialityType = String(appointment.servico?.tipo) || '-1';

        schedule.specialityDefault = {
          code: specialityCode,
          specialityType,
          ...defaultData,
        } as Partial<SpecialityEntity>;

        schedule.procedureDefault = {
          ...(schedule.procedureDefault ?? {}),
          specialityCode: specialityCode,
        } as Partial<ProcedureEntity>;
      }

      if (appointment.convenio?.handle) {
        schedule.insuranceDefault = {
          code: String(appointment.convenio?.handle),
          name: appointment.convenio?.nome,
          friendlyName: appointment.convenio?.nome,
          ...defaultData,
        };
      }

      if (appointment.medico?.handle) {
        schedule.doctorDefault = {
          code: String(appointment.medico?.handle),
          name: appointment.medico?.nome,
          friendlyName: appointment.medico?.nome,
          ...defaultData,
        };
      }
    } catch (err) {
      this.logger.error('ManagerHelpersService.createPatientApointmentObject', err);
    }

    return schedule;
  }

  public replaceManagerPatientToPatient(managerPatient: ManagerPatientResponse): Patient {
    const patient: Patient = {
      bornDate: managerPatient.dataNascimento,
      name: managerPatient.nomeSocial || managerPatient.nome,
      cpf: onlyNumbers(managerPatient.cpf),
      sex: managerPatient.sexo,
      code: String(managerPatient.handle),
      identityNumber: managerPatient.rg,
      email: managerPatient.email,
    };

    if (managerPatient.telefones?.length) {
      const cellPhone = managerPatient.telefones.find(
        (phone) => phone?.tipo?.handle === ManagerPatientPhoneType.cellPhone,
      );

      if (cellPhone) {
        patient.cellPhone = cellPhone.telefone;
      }
    }

    return patient;
  }

  // para exames usa o nome do médico e para consulta usa o nome do recurso, por isso a lógica
  public getValidDoctorIdByAppointmentType(
    appointmentType: AppointmentTypeEntity,
    { handle, handleRecursoMedicoResponsavel },
    resourceItem?: { handleMedicoRespEscala: number },
  ): string {
    if (appointmentType.params.referenceScheduleType === ScheduleType.Consultation) {
      return String(handle);
    }

    const { handleMedicoRespEscala } = resourceItem;

    return String(handleMedicoRespEscala || handleRecursoMedicoResponsavel);
  }

  public formatDate(date: string, hour: string): string {
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    const scheduleHour = moment(hour, 'HH:mm:ss');

    return moment(date)
      .set({
        hours: scheduleHour.hours(),
        minutes: scheduleHour.minutes(),
        seconds: scheduleHour.seconds(),
      })
      .format(dateFormat);
  }

  public async listActiveOrganizationUnits(
    integration: IntegrationDocument,
  ): Promise<OrganizationUnitEntityDocument[]> {
    const cacheKey = `${this.integrationCacheUtilsService.getRedisKey(integration)}:ACTIVE_UNITS`;
    const resourceCache = await this.cacheService.get(cacheKey);
    const expiration = 86_400;

    if (resourceCache) {
      return resourceCache;
    }

    const organizationUnits = await this.entitiesService.getActiveEntities(
      EntityType.organizationUnit,
      null,
      integration._id,
    );

    if (organizationUnits?.length) {
      await this.cacheService.set(organizationUnits, cacheKey, expiration);
    }

    return organizationUnits;
  }

  public omitCanceledSchedules(integration: IntegrationDocument, schedules: any[]) {
    try {
      const activeSchedules: ManagerPatientSchedulesResponse[] = [];

      if (castObjectIdToString(integration._id) === '64d518046ba2080008564f4d') {
        activeSchedules.push(
          ...(schedules?.filter(
            (managerSchedule) => ![29, 43, 39, 9, 33, 8, 5, 35].includes(managerSchedule?.situacao?.handle),
          ) ?? []),
        );
      } else {
        activeSchedules.push(...schedules);
      }

      return activeSchedules;
    } catch (error) {
      return schedules;
    }
  }
}
