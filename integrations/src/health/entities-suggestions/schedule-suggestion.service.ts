import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import {
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
} from '../integrator/interfaces/list-available-schedules.interface';
import { IntegratorService } from '../integrator/service/integrator.service';
import { Appointment } from '../interfaces/appointment.interface';
import { ScheduleSuggestionParams } from './interfaces/schedule-suggestion.interface';

@Injectable()
export class ScheduleSuggestionService {
  constructor(
    @Inject(forwardRef(() => IntegratorService))
    private readonly integratorService: IntegratorService,
  ) {}

  public async listPatientSuggestedSchedule(
    integration: IntegrationDocument,
    suggestionParams: ScheduleSuggestionParams,
    availableSchedulesFilters: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      // Encontrar agendamento existente do paciente que combine com a nova busca (proximidade de natureza)
      const patientBookedScheduleMatched = await this.findPatientScheduleMatchedWithNewSearch(
        integration,
        availableSchedulesFilters,
      );

      if (!patientBookedScheduleMatched) {
        return { schedules: [] };
      }

      // getAvailableSchedules com lógica de proximidade de horário
      const availableSchedulesResponse = await this.getSchedulesNearExistingAppointment(
        integration,
        patientBookedScheduleMatched,
        suggestionParams,
        availableSchedulesFilters,
      );

      return availableSchedulesResponse;
    } catch (error) {
      return { schedules: [] };
    }
  }

  private async findPatientScheduleMatchedWithNewSearch(
    integration: IntegrationDocument,
    availableSchedulesFilters: ListAvailableSchedules,
  ): Promise<Appointment> {
    try {
      const schedules = await this.integratorService.getPatientSchedules(integration._id.toString(), {
        patientCode: availableSchedulesFilters?.patient?.code,
        startDate: moment().startOf('day').valueOf(),
        endDate: moment().add(6, 'months').valueOf(),
        ignoreFlowExecution: true,
      });

      if (!schedules || schedules.length === 0) return null;

      const patientScheduleMatchedWithNewSearch = schedules.find((appointment) => {
        const isSameSpeciality = appointment.speciality.code === availableSchedulesFilters?.filter?.speciality?.code;

        return appointment && moment(appointment.appointmentDate).isSameOrAfter(moment(), 'day') && isSameSpeciality;
      });

      if (!patientScheduleMatchedWithNewSearch) return null;

      return patientScheduleMatchedWithNewSearch;
    } catch (error) {
      return null;
    }
  }

  private async getSchedulesNearExistingAppointment(
    integration: IntegrationDocument,
    patientBaseSchedule: Appointment,
    suggestionParams: ScheduleSuggestionParams,
    availableSchedulesFilters: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const baseDateTime = moment(patientBaseSchedule.appointmentDate);

    // Construir parâmetros para getAvailableSchedules baseados no agendamento do paciente
    const searchParams = this.buildAvailableSchedulesParams(
      availableSchedulesFilters,
      baseDateTime,
      suggestionParams,
      patientBaseSchedule,
    );

    const availableSchedulesResponse = await this.integratorService.getAvailableSchedules(
      integration._id.toString(),
      searchParams,
    );

    // Integraçao Matrix o Range é apenas da duração do procedimento
    // Se não tiver duração, timeRangeHours é 0 e não sugere horários
    if (integration.type === 'MATRIX') {
      suggestionParams.timeRangeHours = 0;
    }

    // Filtrar horários próximos ao existente
    if (availableSchedulesResponse.schedules && availableSchedulesResponse.schedules.length > 0) {
      const filteredSchedules = this.filterSchedulesByProximity(
        availableSchedulesResponse.schedules,
        baseDateTime,
        suggestionParams,
      );

      return { schedules: filteredSchedules };
    }

    return { schedules: [] };
  }

  private buildAvailableSchedulesParams(
    listAvailableSchedulesParams: ListAvailableSchedules,
    baseDateTime: moment.Moment,
    suggestionParams: ScheduleSuggestionParams,
    patientBaseSchedule: Appointment,
  ): ListAvailableSchedules {
    const { maxResults, timeRangeHours } = suggestionParams;

    const startSearch = baseDateTime.clone().subtract(timeRangeHours, 'hours');
    const endSearch = baseDateTime.clone().add(timeRangeHours, 'hours');
    const fromDay = baseDateTime.clone().startOf('day').diff(moment().startOf('day'), 'days');
    const untilDay = fromDay + 1;

    const withinRangePayload = {
      ...listAvailableSchedulesParams,
      filter: {
        ...listAvailableSchedulesParams.filter,
        organizationUnit:
          patientBaseSchedule?.organizationUnit ?? listAvailableSchedulesParams?.filter?.organizationUnit, // limita ao local que ja possui agendamento.
      },
      limit: maxResults * 3, // Buscar mais para ter opções após filtro de proximidade
      fromDay,
      untilDay,
      randomize: false,
      period: {
        start: startSearch.format('HH:mm'),
        end: endSearch.format('HH:mm'),
      },
      isSuggestionRequest: true, // flag para evitar filtragem de regras de agendamento
    };

    return withinRangePayload;
  }

  private filterSchedulesByProximity(
    schedules: Appointment[],
    baseDateTime: moment.Moment,
    suggestionParams: ScheduleSuggestionParams,
  ) {
    const { maxResults, timeRangeHours } = suggestionParams;

    let maxDistanceMinutes = timeRangeHours * 60;

    // se tiver tempo de duração no procedimento, utiliza senão usa o padrão que vem do integrator.
    if (schedules[0]?.duration && Number(schedules[0]?.duration) > 0) {
      maxDistanceMinutes = Number(schedules[0]?.duration);
    }

    // Tratar baseDateTime como UTC se não tiver timezone explícito
    // Isso garante que tanto base quanto schedules estão no mesmo timezone (UTC)
    const baseUtc = moment.utc(baseDateTime.format('YYYY-MM-DDTHH:mm:ss'));

    return schedules
      .map((schedule) => {
        // Garantir que o appointmentDate está sendo tratado como UTC
        const scheduleUtc = moment.utc(schedule.appointmentDate);

        return {
          ...schedule,
          _suggestionDistance: Math.abs(scheduleUtc.diff(baseUtc, 'minutes')),
        };
      })
      .filter((schedule) => {
        // Excluir o próprio horário existente
        const scheduleUtc = moment.utc(schedule.appointmentDate);
        const isSameTime = scheduleUtc.isSame(baseUtc, 'minute');
        if (isSameTime) return false;

        // Filtrar por distância
        return schedule._suggestionDistance <= maxDistanceMinutes;
      })
      .sort((a, b) => moment(a.appointmentDate).valueOf() - moment(b.appointmentDate).valueOf()) // Ordenar horários
      .slice(0, maxResults) // Limitar o máximo de resultados desejados
      .map(({ _suggestionDistance, ...schedule }) => schedule); // Remover campo auxiliar
  }
}
