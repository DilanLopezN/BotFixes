import { Injectable, Logger } from '@nestjs/common';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { Patient } from '../../../interfaces/patient.interface';
import {
  CreatePatientResponse,
  GetPatientResponse,
  PatientScheduleResponse,
  SimplifiedListSchedule,
} from '../interfaces';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { IIntegration, IntegrationRules } from '../../../integration/interfaces/integration.interface';
import {
  ProcedureEntity,
  SpecialityEntity,
  EntityDocument,
  TypeOfService,
  ProcedureEntityDocument,
} from '../../../entities/schema';
import { TypeOfService as CmTypeOfService } from '../interfaces';
import { EntitiesService } from '../../../entities/services/entities.service';
import { EntityType } from '../../../interfaces/entity.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import * as moment from 'moment';

interface CompositeProcedureCodeData {
  code: string;
  areaCode?: string;
  lateralityCode?: string;
  specialityCode?: string;
  specialityType?: string;
}

@Injectable()
export class CmHelpersService {
  private readonly logger = new Logger(CmHelpersService.name);

  constructor(private readonly entitiesService: EntitiesService) {}

  private getCompositeProcedureIdentifiers(): string[] {
    return ['c', 's', 'st', 'a', 'l'];
  }

  public createCompositeProcedureCode(
    integration: IIntegration,
    code: string,
    specialityCode: string,
    specialityType: string,
    areaCode: string,
    lateralityCode: string,
  ): string {
    if (!integration.rules[IntegrationRules.useProcedureWithCompositeCode]) {
      return code;
    }

    const [i0, i1, i2, i3, i4] = this.getCompositeProcedureIdentifiers();

    const pCode = `${code}`;
    const aCode = areaCode ? `${areaCode}` : '';
    const lCode = lateralityCode ? `${lateralityCode}` : '';
    const sCode = specialityCode ? `${specialityCode}` : '';
    const sType = specialityType ? `${specialityType}` : '';

    return `${i0}${pCode}:${i1}${sCode}:${i2}${sType}:${i3}${aCode}:${i4}${lCode}`;
  }

  public getCompositeProcedureCode(integration: IIntegration, code: string): CompositeProcedureCodeData {
    if (!integration.rules[IntegrationRules.useProcedureWithCompositeCode]) {
      return { code };
    }

    const identifiers = this.getCompositeProcedureIdentifiers();
    const parts = code.split(':').map((occ, index) => {
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

  public replacePatient = (result: CreatePatientResponse | GetPatientResponse): Patient => {
    if (!result) {
      return undefined;
    }

    const patient: Patient = {
      code: result.codigo,
      email: result.email,
      sex: result.genero,
      name: result.nome,
      bornDate: result.dataNascimento,
      height: result?.altura || 0,
      weight: result?.peso || 0,
      skinColor: result?.raca || '',
    } as Patient;

    result.documentos?.forEach((document) => {
      if (document?.numero) {
        if (document.tipoDocumento === 0) {
          patient.cpf = document.numero;
        } else if (document.tipoDocumento === 1) {
          patient.identityNumber = document.numero;
        }
      }
    });

    result.telefones?.forEach((phone) => {
      if (phone?.numero && phone?.ddd) {
        if (phone.tipoTelefone === 1) {
          patient.cellPhone = phone.ddd + phone.numero;
        } else if (phone.tipoTelefone === 0) {
          patient.phone = phone.ddd + phone.numero;
        }
      }
    });

    if (!patient.cellPhone) {
      patient.cellPhone = '';
    }

    if (!patient.phone) {
      patient.phone = '';
    }

    return patient;
  };

  public async createPatientApointmentObject(
    integration: IntegrationDocument,
    appointment: PatientScheduleResponse,
  ): Promise<RawAppointment> {
    const { procedimento } = appointment.horario;

    if (!appointment.horario?.procedimento?.codigoEspecialidade && procedimento?.codigo) {
      const procedureEntity = (await this.entitiesService.getEntityByCode(
        String(procedimento.codigo),
        EntityType.procedure,
        integration._id,
      )) as ProcedureEntityDocument;

      procedimento.codigo = procedureEntity?.code;
      procedimento.codigoEspecialidade = procedureEntity?.specialityCode;
      procedimento.tipoEspecialidade = procedureEntity?.specialityType;
    }

    const procedureCode = this.createCompositeProcedureCode(
      integration,
      procedimento.codigo,
      procedimento.codigoEspecialidade,
      procedimento.tipoEspecialidade,
      procedimento.codigoArea,
      procedimento.lateralidade,
    );

    const schedule: RawAppointment = {
      appointmentCode: appointment.codigo,
      appointmentDate: moment(appointment.horario?.dataHoraAgendamento).format('YYYY-MM-DDTHH:mm:ss'),
      duration: appointment.horario?.duracao,
      procedureId: procedureCode,
      doctorId: appointment.horario?.medico?.codigo,
      organizationUnitId: appointment.horario?.unidade?.codigo,
      specialityId: appointment.horario?.procedimento?.codigoEspecialidade,
      insuranceId: appointment.codigoConvenio || appointment.horario?.convenio?.codigo,
      insurancePlanId: appointment.codigoPlano,
      insuranceSubPlanId: appointment.codigoSubPlano,
      planCategoryId: appointment.codigoCategoria,
      appointmentTypeId: appointment.horario.procedimento.tipoEspecialidade,
      status: AppointmentStatus.scheduled,
      isFollowUp: Boolean(appointment.Retorno),
    };

    try {
      const defaultData: Partial<EntityDocument> = {
        canSchedule: false,
        canReschedule: false,
        canCancel: true,
        canConfirmActive: false,
        canConfirmPassive: true,
        canView: true,
      };

      if (procedureCode) {
        schedule.procedureDefault = {
          code: procedureCode,
          name: procedimento.nome,
          friendlyName: procedimento.nome,
          ...defaultData,
        };
      }

      if (appointment.horario?.unidade?.codigo) {
        schedule.organizationUnitDefault = {
          code: appointment.horario?.unidade?.codigo,
          name: appointment.horario?.unidade?.nome,
          friendlyName: appointment.horario?.unidade?.nome,
          ...defaultData,
        };
      }

      if (appointment.horario?.procedimento?.codigoEspecialidade) {
        const specialityCode = appointment.horario?.procedimento?.codigoEspecialidade;
        const specialityType = appointment.horario?.procedimento?.tipoEspecialidade;

        // não retorna nome da especialidade na request, só codigo
        schedule.specialityDefault = {
          code: specialityCode,
          specialityType: specialityType,
          ...defaultData,
        } as Partial<SpecialityEntity>;

        schedule.procedureDefault = {
          ...(schedule.procedureDefault ?? {}),
          specialityCode: specialityCode,
          specialityType: specialityType,
        } as Partial<ProcedureEntity>;
      }

      if (appointment.horario?.convenio?.codigo) {
        schedule.insuranceDefault = {
          code: appointment.horario?.convenio?.codigo,
          name: appointment.horario?.convenio?.nome,
          friendlyName: appointment.horario?.convenio?.nome,
          ...defaultData,
        };
      }

      if (appointment.horario?.medico?.codigo) {
        schedule.doctorDefault = {
          code: appointment.horario?.medico?.codigo,
          name: appointment.horario?.medico?.nome,
          friendlyName: appointment.horario?.medico?.nome,
          ...defaultData,
        };
      }

      if (appointment.codigoPlano) {
        schedule.insurancePlanDefault = {
          code: appointment.codigoPlano,
          ...defaultData,
        };
      }

      if (appointment.codigoSubPlano) {
        schedule.insuranceSubPlanDefault = {
          code: appointment.codigoSubPlano,
          ...defaultData,
        };
      }

      if (appointment.codigoCategoria) {
        schedule.planCategoryDefault = {
          code: appointment.codigoCategoria,
          ...defaultData,
        };
      }
    } catch (err) {
      this.logger.error('CmHelpersService.createPatientApointmentObject', err);
    }

    return schedule;
  }

  public createScheduleObjectFromAvailableSchedules(
    _: IIntegration,
    schedule: SimplifiedListSchedule,
    filters: CorrelationFilter,
  ): RawAppointment {
    return {
      appointmentCode: String(schedule.codigo),
      appointmentDate: moment(schedule.dataHoraAgendamento).format('YYYY-MM-DDTHH:mm:ss'),
      duration: schedule.duracao,
      procedureId: filters.procedure?.code || schedule.idProcedimento,
      doctorId: schedule.idMedico,
      organizationUnitId: schedule.idUnidade,
      insuranceId: schedule.idConvenio,
      specialityId: filters.speciality?.code || filters.procedure?.specialityCode,
      typeOfServiceId: filters.typeOfService?.code,
      status: AppointmentStatus.scheduled,
    };
  }

  public filterIsEmpty = (filter: CorrelationFilter): boolean => {
    return !filter ? true : Object.keys(filter).every((key) => !filter?.[key] || !filter?.[key]._id);
  };

  public typeOfServiceToCmTypeOfService(type: TypeOfService): CmTypeOfService {
    return (
      {
        [TypeOfService.firstAppointment]: CmTypeOfService.firstAppointment,
        [TypeOfService.followUp]: CmTypeOfService.followUp,
        [TypeOfService.default]: CmTypeOfService.recurrence,
      }[type] || CmTypeOfService.recurrence
    );
  }

  public cmTypeOfServiceToTypeOfService(type: CmTypeOfService): TypeOfService {
    return (
      {
        [CmTypeOfService.firstAppointment]: TypeOfService.firstAppointment,
        [CmTypeOfService.followUp]: TypeOfService.followUp,
        [CmTypeOfService.recurrence]: TypeOfService.default,
      }[type] || TypeOfService.default
    );
  }
}
