import { HttpStatus, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { last, orderBy } from 'lodash';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import { CorrelationFilter } from '../interfaces/correlation-filter.interface';
import { InsuranceEntityDocument, ScheduleType, TypeOfService } from '../entities/schema';
import { EntityType } from '../interfaces/entity.interface';
import { EntitiesService } from '../entities/services/entities.service';
import { IntegrationCacheUtilsService } from '../integration-cache-utils/integration-cache-utils.service';
import { HTTP_ERROR_THROWER } from '../../common/exceptions.service';
import { Appointment, FollowUpAppointment, MinifiedAppointments } from '../interfaces/appointment.interface';
import { AuditDataType, AuditIdentifier } from '../audit/audit.interface';
import { PatientFollowUpSchedules, PatientSchedules } from '../integrator/interfaces';
import { AuditService } from '../audit/services/audit.service';
import { IntegrationType } from '../../health/interfaces/integration-types';
import { castObjectIdToString } from '../../common/helpers/cast-objectid';
import { RawAppointment } from './appointment.service';

@Injectable()
export class InterAppointmentService {
  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly auditService: AuditService,
  ) {}

  public async validateInsuranceInterAppointment(
    integration: IntegrationDocument,
    filter: CorrelationFilter,
    patientCode: string,
    getMinifiedPatientSchedules: (
      integration: IntegrationDocument,
      patientSchedules: PatientSchedules,
    ) => Promise<MinifiedAppointments>,
    getPatientFollowUpSchedules?: (
      integration: IntegrationDocument,
      filters: PatientFollowUpSchedules,
      ignoreException: boolean,
    ) => Promise<FollowUpAppointment[]>,
    rules?: {
      ignoreAppointmentType?: boolean;
      method?: 2;
    },
    appointmentCodesToIgnore?: string[],
    isRetry?: boolean,
  ): Promise<[Map<string, number>, number]> {
    const doctorsScheduledMap = new Map<string, number>();

    if (
      integration.rules?.runInterAppointment === false ||
      filter.typeOfService?.params?.referenceTypeOfService === TypeOfService.followUp ||
      filter.appointmentType?.params?.referenceScheduleType === ScheduleType.FollowUp
    ) {
      return [doctorsScheduledMap, 0];
    }

    const defaultAuditData = {
      dataType: AuditDataType.code,
      integrationId: castObjectIdToString(integration._id),
      identifier: AuditIdentifier.interAppointment,
    };

    const currentInsurance: InsuranceEntityDocument = await this.entitiesService.getEntityByCode(
      filter.insurance.code,
      EntityType.insurance,
      integration._id,
    );

    // skip: convenio selecionado é particular, então skipa
    if (currentInsurance?.params?.isParticular) {
      return [doctorsScheduledMap, 0];
    }

    const patientSchedules = await this.integrationCacheUtilsService.getPatientSchedulesCache(integration, patientCode);

    // se nao tiver nada em cache busca os agendamentos do paciente para validar
    if (!patientSchedules && !isRetry) {
      try {
        await getMinifiedPatientSchedules(integration, { patientCode });
        return this.validateInsuranceInterAppointment(
          integration,
          filter,
          patientCode,
          getMinifiedPatientSchedules.bind(this),
          getPatientFollowUpSchedules?.bind(this),
          rules,
          appointmentCodesToIgnore,
          true,
        );
      } catch (error) {
        this.auditService.sendAuditEvent({
          ...defaultAuditData,
          data: {
            msg: 'Erro ao buscar agendamentos',
            data: error,
          },
        });
      }
    }

    // se não conseguir validar, não retorna nenhum horário para agendamento
    if (!patientSchedules) {
      this.auditService.sendAuditEvent({
        ...defaultAuditData,
        data: {
          msg: 'Nenhum agendamento encontrado',
          data: patientSchedules,
        },
      });

      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, {
        message: 'Não foi possível validar interAppointment',
      });
    }

    this.auditService.sendAuditEvent({
      ...defaultAuditData,
      data: {
        msg: 'Encontrados agendamentos',
        data: patientSchedules,
      },
    });

    // não utiliza agendamentos do tipo retorno para validação da interconsulta
    let schedules = patientSchedules.schedules.filter((appointment) => !appointment.isFollowUp);

    // ignora agendamentos da validação de interconsulta, atualmente utilizado para reagendar
    if (appointmentCodesToIgnore?.length) {
      schedules = schedules.filter((appointment) => !appointmentCodesToIgnore?.includes(appointment.appointmentCode));
    }

    let nextAppointment: Appointment | undefined;
    let lastAppointment: Appointment | undefined;

    orderBy(schedules, 'appointmentDate', 'asc').forEach((appointment) => {
      if (moment(appointment.appointmentDate).valueOf() > moment().valueOf()) {
        nextAppointment = appointment;
      } else {
        lastAppointment = appointment;
      }
    });

    const lastAppointmentDate: string | null = lastAppointment?.appointmentDate;
    const nextAppointmentDate: string | null = nextAppointment?.appointmentDate;

    this.auditService.sendAuditEvent({
      ...defaultAuditData,
      data: {
        msg: 'último e próximo agendamento',
        data: { lastAppointmentDate, nextAppointmentDate },
      },
    });

    let interAppointmentPeriodFromFollowUpValidation = 0;

    try {
      const patientFollowUps = await getPatientFollowUpSchedules?.(integration, { patientCode }, true);

      if (patientFollowUps?.length) {
        patientFollowUps
          .filter((followUp) => {
            const { insurance, procedure, speciality } = followUp;

            const procedureOrSpecialityEqual =
              integration.rules?.useProcedureAsInterAppointmentValidation && !!filter.procedure?.code
                ? procedure?.code === filter.procedure?.code
                : speciality?.code === filter.procedure?.specialityCode || speciality?.code === filter.speciality?.code;

            return followUp.inFollowUpPeriod && insurance.code === filter.insurance?.code && procedureOrSpecialityEqual;
          })
          .forEach((item) => {
            const difference = moment.duration(moment(item.followUpLimit).diff(moment())).asDays();

            if (difference > interAppointmentPeriodFromFollowUpValidation) {
              interAppointmentPeriodFromFollowUpValidation = Math.ceil(difference + 1);
            }
          });
      }
    } catch (error) {
      this.auditService.sendAuditEvent({
        ...defaultAuditData,
        data: {
          msg: 'Erro ao validar interconsulta com base nos retornos',
        },
      });
    }

    // skip: nenhum agendamento anterior ou posterior a data atual
    if (!nextAppointmentDate && !lastAppointmentDate && !interAppointmentPeriodFromFollowUpValidation) {
      return [doctorsScheduledMap, 0];
    }

    const insurancesSet = new Set([]);
    schedules?.forEach((appointment) => insurancesSet.add(appointment.insurance?.code));

    const insurances: InsuranceEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
      integration._id,
      Array.from(insurancesSet),
      EntityType.insurance,
    );

    const ignoreAppointmentTypeValidation = rules?.ignoreAppointmentType ?? false;

    // busca ultimo agendamento filtrando pelo que está sendo agendado no momento e diferenciando exame e consulta
    // se a regra sempre é aplicada, então buscar o ultimo ja resolve
    // pois o anterior ja tem mais tempo do que os dias configurados
    const lastValidAppointment = last(
      orderBy(schedules, 'appointmentDate', 'asc').filter((appointment) => {
        const { insurance, procedure, speciality, appointmentType, occupationArea, doctor } = appointment;

        // Ex: bos tem dois convenios com códigos diferentes que são o mesmo
        // então é utilizado o referenceInsuranceType para "agrupa-los" e validar como o mesmo
        // na interconsulta (depende do campo ser preenchido manualmente)
        const isEqualReferenceInsuranceType =
          !!insurance?.params?.referenceInsuranceType &&
          !!filter.insurance?.params?.referenceInsuranceType &&
          insurance?.params?.referenceInsuranceType === filter.insurance?.params?.referenceInsuranceType;

        let appointmentTypeEqual =
          appointmentType?.code === filter.procedure?.specialityType ||
          appointmentType?.code === filter.speciality?.specialityType;

        const isSameInsurance = insurance?.code === filter.insurance?.code || isEqualReferenceInsuranceType;

        if (rules?.method === 2) {
          // validação inserida para interconsulta feegow, e criado esse objeto params também
          // será lógica geral em algum momento depois de validado
          const isEqual =
            !!filter.appointmentType?.params?.referenceScheduleType &&
            speciality?.specialityType === filter.appointmentType?.params?.referenceScheduleType;

          appointmentTypeEqual = appointmentTypeEqual || isEqual;
        }

        // validação específica para comparar apenas area de atuação
        if (integration.rules?.useOccupationAreaAsInterAppointmentValidation) {
          const occupationAreaIsEqual = occupationArea?.code === filter.occupationArea?.code;
          return isSameInsurance && occupationAreaIsEqual && (ignoreAppointmentTypeValidation || appointmentTypeEqual);
        }

        // validação específica para validar procecedimento igual
        let procedureOrSpecialityEqual =
          integration.rules?.useProcedureAsInterAppointmentValidation && !!filter.procedure?.code
            ? procedure?.code === filter.procedure?.code
            : // em alguns cliente não tem procedimento no filtro, então pego os dados do procedimento
              // ou especialidade para validar
              speciality?.code === filter.procedure?.specialityCode || speciality?.code === filter.speciality?.code;

        // validação específica para comparar apenas médicos
        if (integration.rules?.useDoctorAsInterAppointmentValidation) {
          const doctorIsEqual = doctor?.code === filter.doctor?.code;
          // se paciente não selecionou médico adiciona o médico ao mapeamento
          if (!filter.doctor?.code && isSameInsurance && procedureOrSpecialityEqual) {
            let [_, interAppointmentDays] = this.getInterAppointmentBasePeriodAndDifferenceDays(
              insurances,
              appointment,
            );

            if (interAppointmentPeriodFromFollowUpValidation > interAppointmentDays) {
              interAppointmentDays = interAppointmentPeriodFromFollowUpValidation;
            }

            const doctorCode = String(doctor?.code ?? '');
            doctorsScheduledMap.set(doctorCode, interAppointmentDays);
          }
          return (
            isSameInsurance &&
            doctorIsEqual &&
            procedureOrSpecialityEqual &&
            (ignoreAppointmentTypeValidation || appointmentTypeEqual)
          );
        }

        if (integration.type === IntegrationType.CLINIC) {
          const { cbo } = filter.speciality?.data as unknown as { cbo: string };
          procedureOrSpecialityEqual =
            // só usa a regra se tiver um procedimento no filtro
            integration.rules?.useProcedureAsInterAppointmentValidation && !!filter.procedure?.code
              ? procedure?.code === filter.procedure?.code
              : // em alguns cliente não tem procedimento no filtro, então pego os dados do procedimento
                // ou especialidade para validar
                speciality?.code === filter.procedure?.specialityCode ||
                speciality?.code === cbo ||
                speciality?.code === filter.speciality?.code;
        }

        return (
          isSameInsurance && procedureOrSpecialityEqual && (ignoreAppointmentTypeValidation || appointmentTypeEqual)
        );
      }),
    );

    this.auditService.sendAuditEvent({
      ...defaultAuditData,
      data: {
        msg: 'Data para validação',
        data: { lastValidAppointment, interAppointmentPeriodFromFollowUpValidation },
      },
    });

    // se não tem nenhum dando match então retorna
    if (!lastValidAppointment) {
      return [doctorsScheduledMap, interAppointmentPeriodFromFollowUpValidation || 0];
    }

    const [interAppointmentPeriod, differenceInterAppointment] = this.getInterAppointmentBasePeriodAndDifferenceDays(
      insurances,
      lastValidAppointment,
    );

    this.auditService.sendAuditEvent({
      ...defaultAuditData,
      data: {
        msg: 'Parâmetros usados interconsulta',
        data: {
          interAppointmentPeriod,
          executedPeriod: differenceInterAppointment,
          executedPeriodFollowUp: interAppointmentPeriodFromFollowUpValidation,
          rules,
          appointmentCodesToIgnore,
          patientCode,
        },
      },
    });

    if (interAppointmentPeriodFromFollowUpValidation > differenceInterAppointment) {
      return [doctorsScheduledMap, interAppointmentPeriodFromFollowUpValidation];
    }

    return [doctorsScheduledMap, differenceInterAppointment];
  }

  private getInterAppointmentBasePeriodAndDifferenceDays(
    insurances: InsuranceEntityDocument[],
    appointment: Appointment,
  ): [number, number] {
    const insuranceAppointment = insurances.find((insurance) => insurance.code === appointment?.insurance.code);

    // TODO: fixado 30 dias default, transformar em um parametro de integração futuramente
    const interAppointmentPeriod = insuranceAppointment?.params?.interAppointmentPeriod ?? 30;

    // diferença entre hoje e o dia do agendamento
    const differenceLastAppointment = moment.duration(moment().diff(moment(appointment?.appointmentDate))).asDays();

    let interAppointmentDays = Math.ceil(interAppointmentPeriod - differenceLastAppointment + 1);

    return [interAppointmentPeriod, interAppointmentDays];
  }

  public filterInterAppointmentByDoctorCode(
    integration: IntegrationDocument,
    schedule: Appointment & { [key: string]: any },
    doctorsScheduledMapped: Map<string, number>,
    filter: CorrelationFilter,
  ): RawAppointment {
    const doctorId = schedule?.doctorId != null ? String(schedule.doctorId) : '';
    const interAppointmentDays = doctorsScheduledMapped.get(doctorId);
    // Quando houver médico(s) com interconsulta
    // e o paciente não tiver filtrado por médico
    // verifica se o intervalo entre consultas é maior ou igual ao de interconsulta daquele médico
    if (
      doctorsScheduledMapped.size > 0 &&
      integration.rules?.useDoctorAsInterAppointmentValidation &&
      !filter?.doctor?.code &&
      interAppointmentDays
    ) {
      const currentDate = moment();
      const daysDifference = moment(schedule.appointmentDate).diff(currentDate, 'days');

      if (daysDifference >= interAppointmentDays) {
        return schedule;
      }
    } else {
      // Adiciona horário normalmente se não houver médico mapeado com interconsulta
      return schedule;
    }
  }
}
