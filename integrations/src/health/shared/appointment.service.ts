import { Injectable } from '@nestjs/common';
import { shuffle } from 'lodash';
import * as moment from 'moment';
import { EntityDocument } from '../entities/schema';
import { Appointment, AppointmentSortMethod, AppointmentStatus } from '../interfaces/appointment.interface';
import { IIntegration } from '../integration/interfaces/integration.interface';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import { EntityType } from '../interfaces/entity.interface';
import { CorrelationFilterByKeys } from '../interfaces/correlation-filter.interface';
import { EntitiesService } from '../entities/services/entities.service';
import { FlowPeriodOfDay } from '../flow/interfaces/flow.interface';
import { AvailableSchedulesMetadata } from '../integrator/interfaces';
import { castObjectIdToString } from '../../common/helpers/cast-objectid';

const SCHEDULES_LIMIT_TO_PROCESS = 1_000;

export enum PeriodEnum {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  NIGHT = 'night',
  ANY = 'any',
}

interface AppointmentsFilter {
  limit: number;
  sortMethod: string;
  randomize: boolean;
  period: { start: string; end: string };
  periodOfDay: FlowPeriodOfDay;
}

export type RawAppointment = Appointment & {
  procedureId?: string;
  organizationUnitId?: string;
  doctorId?: string;
  insuranceId?: string;
  insurancePlanId?: string;
  insuranceSubPlanId?: string;
  planCategoryId?: string;
  specialityId?: string;
  appointmentTypeId?: string;
  occupationAreaId?: string;
  organizationUnitLocationId?: string;
  typeOfServiceId?: string;
  procedureDefault?: Partial<EntityDocument>;
  organizationUnitDefault?: Partial<EntityDocument>;
  doctorDefault?: Partial<EntityDocument>;
  insuranceDefault?: Partial<EntityDocument>;
  insurancePlanDefault?: Partial<EntityDocument>;
  insuranceSubPlanDefault?: Partial<EntityDocument>;
  planCategoryDefault?: Partial<EntityDocument>;
  specialityDefault?: Partial<EntityDocument>;
  appointmentTypeDefault?: Partial<EntityDocument>;
  organizationUnitAdress?: string;
};

type PreAppointment = Omit<Appointment, 'appointmentDate'> & {
  appointmentDate: moment.Moment;
  organizationUnitId?: string;
};

@Injectable()
export class AppointmentService {
  constructor(private readonly entitiesService: EntitiesService) {}

  public getPeriodFromPeriodOfDay(
    integration: IIntegration,
    { periodOfDay }: AppointmentsFilter,
  ): { start: string; end: string } {
    const period = {
      start: '00:00',
      end: '23:59',
    };

    if (periodOfDay === undefined || periodOfDay === null) {
      return period;
    }

    const useEveningPeriod = integration?.rules?.usesNightTimeInTheSelectionOfPeriod;

    if (periodOfDay === FlowPeriodOfDay.morning) {
      period.start = '00:00';
      period.end = '12:00';
    }

    if (useEveningPeriod) {
      if (periodOfDay === FlowPeriodOfDay.afternoon) {
        period.start = '12:00';
        period.end = '18:00';
      } else if (periodOfDay === FlowPeriodOfDay.night) {
        period.start = '18:00';
        period.end = '23:59';
      }
    } else {
      if (periodOfDay === FlowPeriodOfDay.afternoon) {
        period.start = '12:00';
        period.end = '23:59';
      }
    }

    return period;
  }

  private getPeriodOfDay(periodOfDay: FlowPeriodOfDay): PeriodEnum {
    switch (periodOfDay) {
      case FlowPeriodOfDay.afternoon:
        return PeriodEnum.AFTERNOON;

      case FlowPeriodOfDay.morning:
        return PeriodEnum.MORNING;

      case FlowPeriodOfDay.night:
        return PeriodEnum.NIGHT;

      default:
        return PeriodEnum.ANY;
    }
  }

  public async getAppointments(
    integration: IntegrationDocument,
    filters: AppointmentsFilter,
    appointments: RawAppointment[],
  ): Promise<{ appointments: RawAppointment[]; metadata: AvailableSchedulesMetadata }> {
    const appointmentsBetweenPeriod = this.filterPeriodOfDay(integration, filters, appointments);
    const appointmentsBetweenDayOfWeek = this.filterDayOfWeek(integration, filters, appointmentsBetweenPeriod);
    const newAppointments = this.prepareAppointments(integration, appointmentsBetweenDayOfWeek);
    const validAppointments = this.sortAppointments(this.removeDuplicates(newAppointments));

    if (appointments.length <= filters.limit) {
      const appointments = this.convertAppointments(validAppointments);
      return { appointments, metadata: { numberOfSchedulesLessThanLimit: true } };
    }

    if (!filters.randomize || filters.sortMethod === AppointmentSortMethod.sequential) {
      const appointments = this.convertAppointments(validAppointments.slice(0, filters.limit));
      return { appointments, metadata: null };
    }

    if (filters.sortMethod === AppointmentSortMethod.default) {
      const appointments = this.convertAppointments(shuffle(validAppointments).slice(0, filters.limit));
      return { appointments, metadata: null };
    }

    if (filters.sortMethod === AppointmentSortMethod.firstEachHourDay) {
      const appointments = this.getAppointmentsByFirstByHour(filters, validAppointments);
      return { appointments, metadata: null };
    }

    if (filters.sortMethod === AppointmentSortMethod.firstEachAnyPeriodDay) {
      const appointments = this.getAppointmentsByAnyDayPeriod(filters, validAppointments);
      return { appointments, metadata: null };
    }

    if (filters.sortMethod === AppointmentSortMethod.combineDatePeriodByOrganization) {
      const appointments = this.getAppointmentsByOrganizationAndDayPeriod(integration, filters, validAppointments);
      return { appointments, metadata: null };
    }

    if (!filters.sortMethod || filters.sortMethod === AppointmentSortMethod.firstEachPeriodDay) {
      const appointments = this.getAppointmentsByDayPeriod(integration, filters, validAppointments);
      return { appointments, metadata: null };
    }
  }

  private removeDuplicates(appointments: PreAppointment[]) {
    return Object.values(
      appointments.reduce<{ [key: string]: PreAppointment }>((acc, ob) => {
        acc[ob.appointmentDate.toISOString()] = ob;
        return acc;
      }, {}),
    );
  }

  public filterPeriodOfDay = (
    integration: IIntegration,
    filters: AppointmentsFilter,
    appointments: RawAppointment[],
  ) => {
    const { periodOfDay } = filters;
    const newAppointments = [];
    const resolvedPeriod: PeriodEnum = this.getPeriodOfDay(periodOfDay);

    if (resolvedPeriod === PeriodEnum.ANY) {
      return appointments;
    }

    const { start, end } = this.getPeriodFromPeriodOfDay(integration, filters);
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);

    appointments.forEach((appointment) => {
      const currentDate = moment.utc(appointment.appointmentDate);

      const startDate = currentDate.clone().set({
        hours: startHours,
        minutes: startMinutes,
      });
      const endDate = currentDate.clone().set({
        hours: endHours,
        minutes: endMinutes,
      });

      if (currentDate.valueOf() >= startDate.valueOf() && currentDate.valueOf() <= endDate.valueOf()) {
        newAppointments.push(appointment);
      }
    });

    return newAppointments;
  };

  public filterDayOfWeek = (
    integration: IntegrationDocument,
    _: AppointmentsFilter,
    appointments: RawAppointment[],
  ) => {
    if (['66ff0692f4ca82de2a7669be', '65ef5913ed4c108742a984c7'].includes(castObjectIdToString(integration._id))) {
      return appointments.filter((appointment) => {
        const dayOfWeek = moment(appointment.appointmentDate).isoWeekday();
        // - Daniel de abreu oliveira - Quinta feira só atende particular - 547
        if (appointment.doctorId === '547' && dayOfWeek === 4 && appointment.insuranceId !== '2') {
          return false;
        }

        // - Antonio Ronaldo - não atende unimed na sexta-feira - 493
        if (appointment.doctorId === '493' && dayOfWeek === 5 && appointment.insuranceId === '54') {
          return false;
        }

        return true;
      });
    }

    return appointments;
  };

  private getPeriodFromAppointmentDate = (integration: IIntegration, appointment: PreAppointment) => {
    const hours = appointment.appointmentDate.hours();

    if (hours >= 18 && integration.rules.usesNightTimeInTheSelectionOfPeriod) {
      return PeriodEnum.NIGHT;
    }

    if (hours >= 12) {
      return PeriodEnum.AFTERNOON;
    }

    return PeriodEnum.MORNING;
  };

  private getAppointmentsByOrganizationAndDayPeriod(
    integration: IIntegration,
    { limit, periodOfDay }: AppointmentsFilter,
    appointments: PreAppointment[],
  ): RawAppointment[] {
    const resolvedPeriod: PeriodEnum = this.getPeriodOfDay(periodOfDay);

    let appointmentsByPeriodLimit = 2;

    const groupedDaysCount = this.getCountAppointmentDays(appointments);

    if (groupedDaysCount <= 5) {
      appointmentsByPeriodLimit = 3;
    }

    appointments.sort((a, b) => a.appointmentDate.diff(b.appointmentDate));

    const appointmentsByOrganization: { [key: string]: PreAppointment[] } = {};
    for (const appointment of appointments) {
      if (!appointmentsByOrganization[appointment.organizationUnitId]) {
        appointmentsByOrganization[appointment.organizationUnitId] = [];
      }
      appointmentsByOrganization[appointment.organizationUnitId].push(appointment);
    }

    const intercalatedAppointments: PreAppointment[] = [];
    const organizationsKeys = Object.keys(appointmentsByOrganization);
    let orgKeysIndex = 0;
    let isAllEmptyFlag = false;

    do {
      isAllEmptyFlag = true;
      for (let i = 0; i < organizationsKeys.length; i++) {
        const orgKey = organizationsKeys[orgKeysIndex];
        if (appointmentsByOrganization[orgKey].length > 0) {
          intercalatedAppointments.push(appointmentsByOrganization[orgKey].shift()!);
          isAllEmptyFlag = false;
        }
        orgKeysIndex = (orgKeysIndex + 1) % organizationsKeys.length;
      }
    } while (!isAllEmptyFlag);

    const resolvedAppointments: { [key: string]: { [key: string]: PreAppointment[] } } = {};
    const usedAppointmentDates = new Set<string>();
    let resolvedAppointmentsCount = 0;

    for (const appointment of intercalatedAppointments) {
      const appointmentDate = appointment.appointmentDate.format('YYYY-MM-DD');
      const appointmentPeriod = this.getPeriodFromAppointmentDate(integration, appointment);
      const appointmentDateAndHour = appointment.appointmentDate.format();

      if (!resolvedAppointments[appointmentDate]) {
        resolvedAppointments[appointmentDate] = {
          [PeriodEnum.MORNING]: [],
          [PeriodEnum.AFTERNOON]: [],
          [PeriodEnum.NIGHT]: [],
        };
      }
      if (resolvedPeriod !== PeriodEnum.ANY && resolvedPeriod !== appointmentPeriod) {
        continue;
      }
      if (
        !usedAppointmentDates.has(appointmentDateAndHour) &&
        resolvedAppointments[appointmentDate][appointmentPeriod].length < appointmentsByPeriodLimit
      ) {
        resolvedAppointments[appointmentDate][appointmentPeriod].push(appointment);
        usedAppointmentDates.add(appointmentDateAndHour);
        resolvedAppointmentsCount += 1;
      }
      if (resolvedAppointmentsCount === limit) {
        break;
      }
    }

    const flattenedAppointments = this.flattenAppointments(resolvedAppointments) ?? [];
    flattenedAppointments.sort((a, b) => a.appointmentDate.diff(b.appointmentDate));

    return this.convertAppointments(flattenedAppointments);
  }

  private getAppointmentsByDayPeriod(
    integration: IIntegration,
    { limit, periodOfDay }: AppointmentsFilter,
    appointments: PreAppointment[],
  ): RawAppointment[] {
    const resolvedPeriod: PeriodEnum = this.getPeriodOfDay(periodOfDay);
    const resolvedAppointments: { [key: string]: { [key: string]: PreAppointment[] } } = {};
    let resolvedAppointmentsCount = 0;
    let appointmentsByPeriodLimit = 2;

    const groupedDaysCount = this.getCountAppointmentDays(appointments);

    if (groupedDaysCount <= 5) {
      appointmentsByPeriodLimit = 3;
    }

    for (const appointment of appointments) {
      const appointmentPeriod = this.getPeriodFromAppointmentDate(integration, appointment);
      const appointmentDate = appointment.appointmentDate.format('YYYY-MM-DD');

      if (!resolvedAppointments[appointmentDate]) {
        resolvedAppointments[appointmentDate] = {
          [PeriodEnum.MORNING]: [],
          [PeriodEnum.AFTERNOON]: [],
          [PeriodEnum.NIGHT]: [],
        };
      }

      if (resolvedPeriod !== PeriodEnum.ANY && resolvedPeriod !== appointmentPeriod) {
        continue;
      }

      if (resolvedAppointments[appointmentDate][appointmentPeriod].length < appointmentsByPeriodLimit) {
        resolvedAppointments[appointmentDate][appointmentPeriod].push(appointment);
        resolvedAppointmentsCount += 1;
      }

      if (resolvedAppointmentsCount === limit) {
        break;
      }
    }

    return this.convertAppointments(this.flattenAppointments(resolvedAppointments) ?? []);
  }

  private getAppointmentsByAnyDayPeriod(
    { limit }: AppointmentsFilter,
    appointments: PreAppointment[],
  ): RawAppointment[] {
    const resolvedAppointments: { [key: string]: { [key: string]: PreAppointment[] } } = {};
    let resolvedAppointmentsCount = 0;
    let appointmentsByPeriodLimit = 2;

    const groupedDaysCount = this.getCountAppointmentDays(appointments);

    if (groupedDaysCount <= 5) {
      appointmentsByPeriodLimit = 3;
    }

    for (const appointment of appointments) {
      const appointmentDate = appointment.appointmentDate.format('YYYY-MM-DD');

      if (!resolvedAppointments[appointmentDate]) {
        resolvedAppointments[appointmentDate] = {
          [PeriodEnum.ANY]: [],
        };
      }

      if (resolvedAppointments[appointmentDate][PeriodEnum.ANY].length < 2) {
        resolvedAppointments[appointmentDate][PeriodEnum.ANY].push(appointment);
        resolvedAppointmentsCount += 1;
      }

      if (resolvedAppointmentsCount === limit) {
        break;
      }
    }

    return this.convertAppointments(this.flattenAppointments(resolvedAppointments) ?? []);
  }

  private getAppointmentsByFirstByHour(
    { limit }: AppointmentsFilter,
    appointments: PreAppointment[],
  ): RawAppointment[] {
    const resolvedAppointments: { [key: string]: { [key: string]: number } } = {};
    let resolvedAppointmentsCount = 0;
    const result: PreAppointment[] = [];

    for (const appointment of appointments) {
      const hour = appointment.appointmentDate.hours();
      const appointmentDate = appointment.appointmentDate.format('YYYY-MM-DD');

      if (!resolvedAppointments[appointmentDate]) {
        resolvedAppointments[appointmentDate] = {};
      }

      if (!resolvedAppointments[appointmentDate]?.[hour]) {
        result.push(appointment);

        resolvedAppointments[appointmentDate][hour] = 1;
        resolvedAppointmentsCount += 1;
      }

      if (resolvedAppointmentsCount === limit) {
        break;
      }
    }

    return this.convertAppointments(result);
  }

  private flattenAppointments(resolvedAppointments: {
    [key: string]: { [key: string]: PreAppointment[] };
  }): PreAppointment[] {
    let appointments = [];

    for (const appointmentBag of Object.values(resolvedAppointments)) {
      appointments = [
        ...appointments,
        ...(appointmentBag?.[PeriodEnum.MORNING] ?? []),
        ...(appointmentBag?.[PeriodEnum.AFTERNOON] ?? []),
        ...(appointmentBag?.[PeriodEnum.NIGHT] ?? []),
        ...(appointmentBag?.[PeriodEnum.ANY] ?? []),
      ];
    }

    return appointments;
  }

  private convertAppointments(appo: PreAppointment[]): RawAppointment[] {
    return appo.map((appointment) => ({
      ...appointment,
      appointmentDate: appointment.appointmentDate.toISOString(),
    }));
  }

  private prepareAppointments(integration: IIntegration, appointments: RawAppointment[]): PreAppointment[] {
    appointments = appointments.slice(0, SCHEDULES_LIMIT_TO_PROCESS);

    if (integration?.rules?.timeFirstAvailableSchedule > 0) {
      // sim esse utc ta errado, mas única maneira que achei de resolver rapidamente
      const currentDate = moment().add(integration.rules.timeFirstAvailableSchedule, 'minutes').utcOffset(-3);

      appointments = appointments.filter((appointment) => {
        const appointmentDate = moment(appointment.appointmentDate);
        return appointmentDate.isAfter(currentDate);
      });
    }

    return appointments.map((appointment) => {
      return {
        ...appointment,
        appointmentDate: moment.utc(appointment.appointmentDate),
      };
    });
  }

  private sortAppointments(appointments: PreAppointment[]): PreAppointment[] {
    return appointments.sort((a, b) => {
      return a.appointmentDate.valueOf() - b.appointmentDate.valueOf();
    });
  }

  public async transformSchedules(
    integration: IntegrationDocument,
    rawAppointments: RawAppointment[],
    onlyActiveEntities = true,
  ): Promise<Appointment[]> {
    const correlationsKeys: { [key: string]: Set<string> } = {};
    for (const schedule of rawAppointments) {
      Object.keys(EntityType).forEach((key) => {
        const scheduleKey = `${key}Id`;

        if (!schedule[scheduleKey]) {
          return;
        }

        if (!correlationsKeys[key]) {
          correlationsKeys[key] = new Set();
        }

        correlationsKeys[key].add(schedule[scheduleKey]);
      });
    }

    // cria um objeto para consultar no banco apenas entidades únicas
    // evitando buscar o mesmo código diversas vezes
    const correlationsKeysData: CorrelationFilterByKeys = Object.keys(EntityType).reduce((acc, key) => {
      if (correlationsKeys[key]?.size) {
        acc[key] = Array.from(correlationsKeys[key]);
      }
      return acc;
    }, {});

    const correlationData: { [entityType: string]: { [entityCode: string]: EntityDocument } } =
      await this.entitiesService.createCorrelationDataKeys(correlationsKeysData, integration._id, onlyActiveEntities);

    const appointments: Appointment[] = [];

    for await (const appointment of rawAppointments) {
      const replacedAppointment: Appointment = {
        appointmentCode: appointment.appointmentCode,
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration,
        status:
          appointment.status === null || appointment.status === undefined
            ? AppointmentStatus.scheduled
            : appointment.status,
        data: appointment.data,
        isFollowUp: appointment.isFollowUp,
        price: appointment.price,
        canCancel: appointment.canCancel,
        canConfirm: appointment.canConfirm,
        canReschedule: appointment.canReschedule,
        guidance: appointment.guidance,
        guidanceLink: appointment?.guidanceLink,
        observation: appointment.observation,
        warning: appointment.warning,
        organizationUnitAdress: appointment.organizationUnitAdress,
      };

      for (const entityType of Object.keys(EntityType)) {
        const defaultKeyData = appointment[`${entityType}Default`];
        const entity = correlationData?.[entityType]?.[appointment?.[`${entityType}Id`]];

        if (entity) {
          replacedAppointment[entityType] = entity;
          // se não estiver dentro do correlationData tenta procurar direto no appointment
        } else if (appointment[entityType]) {
          replacedAppointment[entityType] = appointment[entityType];
          // se não tiver a entidade tenta procurar por entidade default
        } else if (defaultKeyData) {
          replacedAppointment[entityType] = defaultKeyData;
        }

        // Para não permitir reagendamento no agendamento do tipo retorno
        if (replacedAppointment.isFollowUp && replacedAppointment[EntityType.appointmentType]) {
          replacedAppointment[EntityType.appointmentType].canReschedule = false;
        }
      }

      appointments.push(replacedAppointment);
    }

    return appointments;
  }

  private getCountAppointmentDays(appointments: PreAppointment[]): number {
    const groupedAppointments: { [date: string]: Appointment[] } = appointments.reduce((acc, appointment) => {
      const formattedDate = moment(appointment.appointmentDate).format('YYYY-MM-DD');

      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }

      acc[formattedDate].push(appointment);
      return acc;
    }, {});

    return Object.keys(groupedAppointments || {}).length;
  }
}
