import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { sortByKeys } from '../../common/helpers/sort-objectkeys';
import { CacheService } from '../../core/cache/cache.service';
import { IntegrationCacheUtilsService } from '../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import { CmRulesHandlerService } from '../integrations/cm-integration/services/cm-rules-handler.service';
import {
  AvailableSchedulesMetadata,
  ListAvailableSchedules,
} from '../integrator/interfaces/list-available-schedules.interface';
import { EntityType } from '../interfaces/entity.interface';
import { IntegrationType } from '../interfaces/integration-types';
import * as moment from 'moment';
import { IRulesHandler } from './rules-handler.interface';
import { RawAppointment } from '../shared/appointment.service';
import { INTERNAL_ERROR_THROWER } from '../../common/exceptions.service';
import { PatientSchedules } from '../integrator/interfaces';
import { MinifiedAppointments } from '../interfaces/appointment.interface';

@Injectable()
export class RulesHandlerService {
  private readonly logger = new Logger(RulesHandlerService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly moduleRef: ModuleRef,
  ) {}

  getDynamicService(integration: IntegrationDocument): IRulesHandler {
    switch (integration?.type) {
      case IntegrationType.CM:
        return this.moduleRef.get<CmRulesHandlerService>(CmRulesHandlerService, { strict: false });
    }
  }

  private createRedisKeyFromCacheFirstAvailableSchedules(
    integration: IntegrationDocument,
    { filter }: ListAvailableSchedules,
  ): string {
    const customRedisKey: { [key: string]: string } = {};

    Object.keys(EntityType).forEach((entityType) => {
      const entity = filter[entityType];

      if (entity?._id) {
        customRedisKey[entityType] = entity._id;
      }
    });

    return this.cacheService.createCustomKey(
      `${this.integrationCacheUtilsService.getRedisKey(integration)}:firstAvailableSchedule`,
      sortByKeys(customRedisKey),
    );
  }

  public async getParamsFromListAvailableSchedules(
    integration: IntegrationDocument,
    filters: ListAvailableSchedules,
  ): Promise<ListAvailableSchedules> {
    try {
      const { timeCacheFirstAppointmentAvailableForFutureSearches = 0 } = integration.rules ?? {};

      if (!timeCacheFirstAppointmentAvailableForFutureSearches) {
        return filters;
      }

      const service = this.getDynamicService(integration);
      let redisKey: string;

      if (service?.createRedisKeyFromCacheFirstAvailableSchedules) {
        redisKey = service.createRedisKeyFromCacheFirstAvailableSchedules(integration, filters);
      } else {
        redisKey = this.createRedisKeyFromCacheFirstAvailableSchedules(integration, filters);
      }

      const firstScheduleAvailable = await this.cacheService.get(redisKey);
      const date = moment(firstScheduleAvailable);

      if (!date.isValid() || date.valueOf() < moment().valueOf()) {
        return filters;
      }

      const daysDifference = moment(date).diff(moment(), 'days');

      if (filters.fromDay > daysDifference) {
        return filters;
      }

      return {
        ...filters,
        fromDay: daysDifference,
        untilDay: filters.untilDay - daysDifference,
      };
    } catch (error) {
      this.logger.error(error);
      return filters;
    }
  }

  public async setDataFromListAvailableSchedules(
    integration: IntegrationDocument,
    filters: ListAvailableSchedules,
    firstAvailableDate: string,
  ): Promise<void> {
    try {
      const { timeCacheFirstAppointmentAvailableForFutureSearches = 0 } = integration.rules ?? {};

      if (!timeCacheFirstAppointmentAvailableForFutureSearches) {
        return;
      }

      const service = this.getDynamicService(integration);
      let redisKey: string;

      if (service?.createRedisKeyFromCacheFirstAvailableSchedules) {
        redisKey = service.createRedisKeyFromCacheFirstAvailableSchedules(integration, filters);
      } else {
        redisKey = this.createRedisKeyFromCacheFirstAvailableSchedules(integration, filters);
      }

      await this.cacheService.set(
        firstAvailableDate,
        redisKey,
        timeCacheFirstAppointmentAvailableForFutureSearches * 60,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async removeSchedulesFilteredBySameDayRules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
    replacedAppointments: RawAppointment[],
    metadata: AvailableSchedulesMetadata,
    filterSchedulesByProcedure: boolean = false,
    getMinifiedPatientSchedules: (
      integration: IntegrationDocument,
      patientSchedules: PatientSchedules,
    ) => Promise<MinifiedAppointments>,
    isRetry?: boolean,
  ): Promise<{ replacedAppointments: RawAppointment[]; metadata: AvailableSchedulesMetadata }> {
    try {
      const { patient } = availableSchedules;
      const {
        doNotAllowSameDayScheduling = false,
        doNotAllowSameDayAndDoctorScheduling = false,
        doNotAllowSameHourScheduling = false,
        minutesAfterAppointmentCanSchedule = 60,
      } = integration.rules ?? {};
      const filterSchedules = doNotAllowSameDayScheduling || doNotAllowSameDayAndDoctorScheduling;

      if (!replacedAppointments?.length) {
        return { replacedAppointments, metadata };
      }

      if (filterSchedules && replacedAppointments.length && patient?.code) {
        const patientSchedules = await this.integrationCacheUtilsService.getPatientSchedulesCache(
          integration,
          patient.code,
        );

        if (!patientSchedules && !isRetry) {
          try {
            await getMinifiedPatientSchedules(integration, { patientCode: patient.code });
            return this.removeSchedulesFilteredBySameDayRules(
              integration,
              availableSchedules,
              replacedAppointments,
              metadata,
              filterSchedulesByProcedure,
              getMinifiedPatientSchedules.bind(this),
              true,
            );
          } catch (error) {
            throw INTERNAL_ERROR_THROWER('RulesHandlerService.removeScheduleSameDayOrSameDayAndDoctor', error);
          }
        }

        const nextPatientSchedules = patientSchedules?.schedules?.filter(
          (schedule) => moment(schedule.appointmentDate).valueOf() > moment().valueOf(),
        );

        if (nextPatientSchedules?.length) {
          metadata.doNotAllowSameDayAndDoctorScheduling = doNotAllowSameDayAndDoctorScheduling;
          metadata.doNotAllowSameDayScheduling = doNotAllowSameDayScheduling;

          const groupedSchedules: { [scheduleDate: string]: RawAppointment[] } = {};

          replacedAppointments.forEach((schedule) => {
            const formattedDate = moment(schedule.appointmentDate).format('YYYY-MM-DD');

            if (!groupedSchedules[formattedDate]) {
              groupedSchedules[formattedDate] = [];
            }

            groupedSchedules[formattedDate].push(schedule);
          });

          nextPatientSchedules.forEach((patientSchedule) => {
            const patientScheduleDate = moment(patientSchedule.appointmentDate).format('YYYY-MM-DD');

            // regra permite agendar no mesmo horário ou apenas horários posteriores
            if (doNotAllowSameHourScheduling) {
              groupedSchedules[patientScheduleDate] = groupedSchedules[patientScheduleDate]?.filter((appointment) => {
                const scheduleDate = moment(appointment.appointmentDate);
                const patientAppointment = moment(patientSchedule.appointmentDate);

                const timeDifference = scheduleDate.diff(patientAppointment, 'minutes');

                // oferta de horário não entra
                if (timeDifference < minutesAfterAppointmentCanSchedule) {
                  return false;
                }
                // oferta de horário entra
                return true;
              });
            }

            if (doNotAllowSameDayAndDoctorScheduling && groupedSchedules[patientScheduleDate]?.length) {
              groupedSchedules[patientScheduleDate] = groupedSchedules[patientScheduleDate]?.filter((appointment) => {
                return (
                  doNotAllowSameDayAndDoctorScheduling &&
                  !!appointment.doctorId &&
                  !!patientSchedule.doctor?.code &&
                  appointment.doctorId !== patientSchedule.doctor?.code
                );
              });
            } else if (
              filterSchedulesByProcedure &&
              patientSchedule?.procedure?.code &&
              groupedSchedules[patientScheduleDate]?.length
            ) {
              const shouldDeleteDateSchedule =
                patientSchedule?.procedure?.code.toString() ===
                groupedSchedules[patientScheduleDate]?.[0]?.procedureId?.toString();

              if (shouldDeleteDateSchedule) {
                delete groupedSchedules[patientScheduleDate];
              }
            } else {
              delete groupedSchedules[patientScheduleDate];
            }
          });

          const filteredSchedules = Object.entries(groupedSchedules).reduce((acc, [_, schedules]) => {
            if (!Array.isArray(schedules)) {
              return acc;
            }

            return [...acc, ...schedules];
          }, [] as RawAppointment[]);

          if (filteredSchedules.length < replacedAppointments.length) {
            replacedAppointments = [...filteredSchedules];
          }
        }
      }

      return { replacedAppointments, metadata };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('RulesHandlerService.removeScheduleSameDayOrSameDayAndDoctor', error);
    }
  }
}
