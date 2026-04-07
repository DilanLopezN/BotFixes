import { Injectable } from '@nestjs/common';
import { shuffle } from 'lodash';
import * as moment from 'moment';
import { EntityDocument, TypeOfService } from '../entities/schema';
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
    const validAppointments = integration?.rules?.allowDuplicateSchedules
      ? this.sortAppointments(newAppointments)
      : this.sortAppointments(this.removeDuplicates(newAppointments));

    if (filters.sortMethod === AppointmentSortMethod.firstEachDay) {
      const appointments = this.getAppointmentsByFirstEachDay(filters, validAppointments);
      return { appointments, metadata: null };
    }

    // método de balanceamento por médico, primeiros de cada médico (com desempate randomico) e depois horários sequenciais para preencher o restante
    if (filters.sortMethod === AppointmentSortMethod.firstEachDoctorBalanced) {
      const appointments = this.getAppointmentsByDoctorBalanced(integration, filters, validAppointments);
      return { appointments, metadata: null };
    }

    // métodos de balanceamento por médico, primeiros de cada médico (com desempate randomico) e depois usa Fila de Prioridade Balanceada para preencher o restante
    if (filters.sortMethod === AppointmentSortMethod.firstEachDoctorFullyBalanced) {
      const appointments = this.getAppointmentsByDoctorFullyBalanced(integration, filters, validAppointments);
      return { appointments, metadata: null };
    }

    if (appointments.length <= filters.limit) {
      const appointments = this.convertAppointments(validAppointments);
      return { appointments, metadata: { numberOfSchedulesLessThanLimit: true } };
    }

    if (filters.sortMethod === AppointmentSortMethod.sequential) {
      const appointments = this.convertAppointments(validAppointments.slice(0, filters.limit));
      return { appointments, metadata: null };
    }

    if (filters.sortMethod === AppointmentSortMethod.default) {
      if (filters.randomize) {
        const appointments = this.convertAppointments(shuffle(validAppointments).slice(0, filters.limit));
        return { appointments, metadata: null };
      } else {
        const appointments = this.convertAppointments(validAppointments.slice(0, filters.limit));
        return { appointments, metadata: null };
      }
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

    if (hours >= 18 && integration.rules?.usesNightTimeInTheSelectionOfPeriod) {
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

  private getAppointmentsByDoctorBalanced(
    integration: IIntegration,
    { limit, periodOfDay }: AppointmentsFilter,
    appointments: PreAppointment[],
  ): RawAppointment[] {
    const resolvedPeriod: PeriodEnum = this.getPeriodOfDay(periodOfDay);

    // Agrupa todos os horários (filtrados por período) por médico já ordenados
    const appointmentsPerDoctor: { [doctorCode: string]: PreAppointment[] } = {};
    for (const appointment of appointments) {
      if (resolvedPeriod !== PeriodEnum.ANY) {
        const period = this.getPeriodFromAppointmentDate(integration, appointment);
        if (period !== resolvedPeriod) continue;
      }

      // Tipado Any para acessar doctorDefault e doctorId que só existem em RawAppointment
      const raw = appointment as any;
      const doctorCode =
        appointment.doctor?.code?.toString() ||
        raw.doctorDefault?.code?.toString() ||
        raw.doctorId?.toString() ||
        'unknown';

      if (!appointmentsPerDoctor[doctorCode]) {
        appointmentsPerDoctor[doctorCode] = [];
      }
      appointmentsPerDoctor[doctorCode].push(appointment);
    }

    // Ordena os horários de cada médico (mais cedo primeiro)
    Object.values(appointmentsPerDoctor).forEach((preAppointment) =>
      preAppointment.sort((a, b) => a.appointmentDate.diff(b.appointmentDate)),
    );

    // Primeiro: pega o primeiro horário (mais cedo) de cada médico
    const firstByDoctor: PreAppointment[] = Object.values(appointmentsPerDoctor).map(
      (preAppointment) => preAppointment[0],
    );

    // Empate de timestamps idênticos: mantém apenas um aleatório por instante
    const timeBuckets = new Map<string, PreAppointment[]>();
    for (const appointment of firstByDoctor) {
      const key = appointment.appointmentDate.toISOString();
      const dateIndexed = timeBuckets.get(key);
      if (dateIndexed) dateIndexed.push(appointment);
      else timeBuckets.set(key, [appointment]);
    }

    const appointmentSelection: PreAppointment[] = [];
    for (const [, appointmentArray] of timeBuckets) {
      // se não tiver empate, seleciona
      if (appointmentArray.length === 1) {
        appointmentSelection.push(appointmentArray[0]);
      }
      // se tiver horário empatado - escolha randômica
      else {
        const randomIndex = Math.floor(Math.random() * appointmentArray.length);
        appointmentSelection.push(appointmentArray[randomIndex]);
      }
    }

    // Se já atingiu o limite, encerra
    if (appointmentSelection.length >= limit) {
      appointmentSelection.sort((a, b) => a.appointmentDate.diff(b.appointmentDate));
      return this.convertAppointments(appointmentSelection.slice(0, limit));
    }

    // Complemento: adiciona horários extras dos médicos já selecionados,
    // depois horários dos médicos que perderam no empate (se existirem),
    // até preencher o limit.
    const usedDates = new Set(appointmentSelection.map((a) => a.appointmentDate.toISOString()));
    const usedDoctors = new Set(
      appointmentSelection.map((appointment) => {
        const raw = appointment as any;
        return (
          appointment.doctor?.code?.toString() ||
          raw.doctorDefault?.code?.toString() ||
          raw.doctorId?.toString() ||
          'unknown'
        );
      }),
    );

    // Médicos que foram descartados no empate (não apareceram em appointmentSelection)
    const unusedDoctors: string[] = [];
    for (const [dateKey, appointmentArray] of timeBuckets) {
      if (appointmentArray.length > 1) {
        // Verifica quais não entraram
        const kept = appointmentSelection.find((a) => a.appointmentDate.toISOString() === dateKey);
        const keptDoctorCode =
          kept?.doctor?.code?.toString() ||
          (kept as any)?.doctorDefault?.code?.toString() ||
          (kept as any)?.doctorId?.toString() ||
          'unknown';
        for (const candidate of appointmentArray) {
          const candidateDoctorCode =
            candidate.doctor?.code?.toString() ||
            (candidate as any).doctorDefault?.code?.toString() ||
            (candidate as any).doctorId?.toString() ||
            'unknown';
          if (candidateDoctorCode !== keptDoctorCode) {
            unusedDoctors.push(candidateDoctorCode);
          }
        }
      }
    }

    const result: PreAppointment[] = [...appointmentSelection];

    // 1) Adiciona horários extras dos médicos já presentes
    for (const doctorCode of usedDoctors) {
      if (result.length >= limit) break;
      const list = appointmentsPerDoctor[doctorCode];
      if (!list) continue;
      for (let i = 1; i < list.length && result.length < limit; i++) {
        const appt = list[i];
        const iso = appt.appointmentDate.toISOString();
        if (usedDates.has(iso)) continue;
        usedDates.add(iso);
        result.push(appt);
      }
    }

    // 2) Se ainda não completou, adiciona horários dos médicos que perderam no empate
    for (const doctorCode of unusedDoctors) {
      if (result.length >= limit) break;
      const list = appointmentsPerDoctor[doctorCode];
      if (!list) continue;
      for (let i = 0; i < list.length && result.length < limit; i++) {
        const appt = list[i];
        const iso = appt.appointmentDate.toISOString();
        if (usedDates.has(iso)) continue;
        usedDates.add(iso);
        result.push(appt);
      }
    }

    // 3) Se ainda faltar e houver outros médicos (não usados nem perdidos), completa
    for (const [doctorCode, appointmentArray] of Object.entries(appointmentsPerDoctor)) {
      if (result.length >= limit) break;
      if (usedDoctors.has(doctorCode) || unusedDoctors.includes(doctorCode)) continue;
      for (const appt of appointmentArray) {
        if (result.length >= limit) break;
        const iso = appt.appointmentDate.toISOString();
        if (usedDates.has(iso)) continue;
        usedDates.add(iso);
        result.push(appt);
      }
    }

    result.sort((a, b) => a.appointmentDate.diff(b.appointmentDate));
    return this.convertAppointments(result.slice(0, limit));
  }

  private getAppointmentsByDoctorFullyBalanced(
    integration: IIntegration,
    { limit, periodOfDay }: AppointmentsFilter,
    appointments: PreAppointment[],
  ): RawAppointment[] {
    const resolvedPeriod: PeriodEnum = this.getPeriodOfDay(periodOfDay);

    // Agrupa todos os horários por médico, filtrando por período se necessário
    const appointmentsPerDoctor: { [doctorCode: string]: PreAppointment[] } = {};
    for (const appointment of appointments) {
      if (resolvedPeriod !== PeriodEnum.ANY) {
        const period = this.getPeriodFromAppointmentDate(integration, appointment);
        if (period !== resolvedPeriod) continue;
      }

      const raw = appointment as any;
      const doctorCode =
        appointment.doctor?.code?.toString() ||
        raw.doctorDefault?.code?.toString() ||
        raw.doctorId?.toString() ||
        'unknown';

      if (!appointmentsPerDoctor[doctorCode]) {
        appointmentsPerDoctor[doctorCode] = [];
      }
      appointmentsPerDoctor[doctorCode].push(appointment);
    }

    // Ordena os horários de cada médico cronologicamente
    Object.values(appointmentsPerDoctor).forEach((doctorAppointments) =>
      doctorAppointments.sort((a, b) => a.appointmentDate.diff(b.appointmentDate)),
    );

    // FASE 1: Pega o primeiro horário de cada médico
    const firstByDoctor: PreAppointment[] = Object.values(appointmentsPerDoctor).map(
      (doctorAppointments) => doctorAppointments[0],
    );

    // Resolve empates de timestamps: mantém apenas um aleatório por instante
    const timeBuckets = new Map<string, PreAppointment[]>();
    for (const appointment of firstByDoctor) {
      const key = appointment.appointmentDate.toISOString();
      const dateIndexed = timeBuckets.get(key);
      if (dateIndexed) dateIndexed.push(appointment);
      else timeBuckets.set(key, [appointment]);
    }

    const getDoctorCode = (appointment: PreAppointment): string => {
      const raw = appointment as any;
      return (
        appointment.doctor?.code?.toString() ||
        raw.doctorDefault?.code?.toString() ||
        raw.doctorId?.toString() ||
        'unknown'
      );
    };

    const result: PreAppointment[] = [];
    const usedDates = new Set<string>();

    // Contagem de contribuições por médico e índice do próximo horário disponível
    const contributions: { [doctorCode: string]: number } = {};
    const doctorIndexes: { [doctorCode: string]: number } = {};

    for (const doctorCode of Object.keys(appointmentsPerDoctor)) {
      contributions[doctorCode] = 0;
      doctorIndexes[doctorCode] = 0;
    }

    // Processa os buckets da Fase 1: registra o vencedor e descarta duplicatas de timestamp
    for (const [, appointmentArray] of timeBuckets) {
      const randomIndex = appointmentArray.length === 1 ? 0 : Math.floor(Math.random() * appointmentArray.length);
      const winner = appointmentArray[randomIndex];
      const winnerCode = getDoctorCode(winner);

      result.push(winner);
      usedDates.add(winner.appointmentDate.toISOString());
      contributions[winnerCode]++;
      doctorIndexes[winnerCode] = 1; // próximo horário do vencedor começa no índice 1
    }

    // Se já atingiu o limite, encerra
    if (result.length >= limit) {
      result.sort((a, b) => a.appointmentDate.diff(b.appointmentDate));
      return this.convertAppointments(result.slice(0, limit));
    }

    // FASE 2: Fila de prioridade balanceada
    // A cada slot: entre os médicos com menos contribuições, escolhe o que tem o próximo horário mais cedo
    while (result.length < limit) {
      // Filtra médicos que ainda têm horários disponíveis
      const activeDoctors = Object.keys(appointmentsPerDoctor).filter(
        (dc) => doctorIndexes[dc] < appointmentsPerDoctor[dc].length,
      );

      if (activeDoctors.length === 0) break;

      // Encontra a contagem mínima entre os médicos ativos
      const minContribution = Math.min(...activeDoctors.map((dc) => contributions[dc]));

      // Filtra apenas os médicos elegíveis (com contagem mínima)
      const eligibleDoctors = activeDoctors.filter((dc) => contributions[dc] === minContribution);

      // Entre os elegíveis, escolhe o próximo horário mais cedo (descartando timestamps já usados)
      let chosen: PreAppointment | null = null;
      let chosenDoctor: string | null = null;

      for (const dc of eligibleDoctors) {
        // Avança o índice enquanto o horário atual já foi usado
        while (
          doctorIndexes[dc] < appointmentsPerDoctor[dc].length &&
          usedDates.has(appointmentsPerDoctor[dc][doctorIndexes[dc]].appointmentDate.toISOString())
        ) {
          doctorIndexes[dc]++;
        }

        if (doctorIndexes[dc] >= appointmentsPerDoctor[dc].length) continue;

        const candidate = appointmentsPerDoctor[dc][doctorIndexes[dc]];

        if (!chosen || candidate.appointmentDate.isBefore(chosen.appointmentDate)) {
          chosen = candidate;
          chosenDoctor = dc;
        }
      }

      if (!chosen || !chosenDoctor) break;

      result.push(chosen);
      usedDates.add(chosen.appointmentDate.toISOString());
      contributions[chosenDoctor]++;
      doctorIndexes[chosenDoctor]++;
    }

    result.sort((a, b) => a.appointmentDate.diff(b.appointmentDate));
    return this.convertAppointments(result.slice(0, limit));
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

  private getAppointmentsByFirstEachDay(
    { limit }: AppointmentsFilter,
    appointments: PreAppointment[],
  ): RawAppointment[] {
    const resolvedAppointments: { [key: string]: PreAppointment } = {};
    let resolvedAppointmentsCount = 0;

    for (const appointment of appointments) {
      const appointmentDate = appointment.appointmentDate.format('YYYY-MM-DD');

      // Se ainda não temos um horário para esse dia, ou se este é mais cedo que o existente
      if (!resolvedAppointments[appointmentDate]) {
        resolvedAppointments[appointmentDate] = appointment;
        resolvedAppointmentsCount += 1;
      }

      // Como os appointments já vêm ordenados por data (sortAppointments),
      // o primeiro de cada dia será sempre o mais cedo
      // Portanto, só precisamos verificar se já existe um para aquele dia

      if (resolvedAppointmentsCount === limit) {
        break;
      }
    }

    // Converte o objeto em array e ordena por data
    const result = Object.values(resolvedAppointments).sort((a, b) => a.appointmentDate.diff(b.appointmentDate));

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
        if (
          (replacedAppointment.isFollowUp ||
            replacedAppointment[EntityType.typeOfService]?.params?.referenceTypeOfService === TypeOfService.followUp) &&
          replacedAppointment[EntityType.typeOfService]
        ) {
          replacedAppointment[EntityType.typeOfService].canReschedule = false;
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
