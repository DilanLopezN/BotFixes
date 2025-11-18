import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import {
  AvailableSchedulesPeriodPatient,
  ListAvailableSchedules,
} from '../../integrator/interfaces/list-available-schedules.interface';
import { AppointmentSortMethod } from '../../interfaces/appointment.interface';
import { CorrelationFilterByKey } from '../../interfaces/correlation-filter.interface';
import { FlowPeriodOfDay } from '../../flow/interfaces/flow.interface';
import {
  ListAvailableSchedulesInput,
  ListAvailableSchedulesOutput,
  PeriodOfDay,
} from '../interfaces/available-schedules.interface';
import { IntegratorService } from '../../integrator/service/integrator.service';
import { CreateSchedule } from '../../integrator/interfaces/create-schedule.interface';
import { CreateScheduleInput, CreateScheduleOutput } from '../interfaces/create-schedule.interface';
import { TypeOfService } from 'health/entities/schema';
import { GetScheduleValueInput, GetScheduleValueOutput } from '../interfaces/get-schedule-value.interface';
import { GetScheduleValue } from 'health/integrator/interfaces';

@Injectable()
export class SchedulingAppointmentsService {
  constructor(private readonly integratorService: IntegratorService) {}

  public async listAvailableSchedules(
    integrationId: string,
    isRetry: boolean,
    data: ListAvailableSchedulesInput,
  ): Promise<ListAvailableSchedulesOutput> {
    try {
      const correlationFilterList: CorrelationFilterByKey = {
        appointmentType: data?.appointmentTypeCode,
        doctor: data?.doctorCode,
        insurance: data?.insuranceCode,
        insurancePlan: data?.insurancePlanCode,
        insuranceSubPlan: data?.insuranceSubPlanCode,
        occupationArea: data?.occupationAreaCode,
        organizationUnit: data?.organizationUnitCode,
        organizationUnitLocation: data?.organizationUnitLocationCode,
        planCategory: data?.planCategoryCode,
        procedure: data?.procedureCode,
        speciality: data?.specialityCode,
        typeOfService: data?.typeOfServiceCode,
      };
      const filter = await this.integratorService.getCorrelationFilter(integrationId, correlationFilterList);

      let period: FlowPeriodOfDay;
      switch (data.periodOfDay) {
        case PeriodOfDay.morning:
          period = 0;
        case PeriodOfDay.afternoon:
          period = 1;
        case PeriodOfDay.night:
          period = 3;
        case PeriodOfDay.indifferent:
          period = 2;
        default:
          period = 2;
      }

      const patient: AvailableSchedulesPeriodPatient = { code: data.patientErpCode, bornDate: null };
      const availableSchedules: ListAvailableSchedules = {
        limit: data.resultsLimit,
        fromDay: data.fromDaySearch,
        untilDay: data.untilDaySearch,
        randomize: true,
        periodOfDay: period,
        sortMethod: AppointmentSortMethod.sequential,
        patient: patient,
        filter: filter,
      };
      const { schedules } = await this.integratorService.getAvailableSchedules(
        integrationId,
        availableSchedules,
        isRetry,
      );

      return {
        count: schedules.length,
        schedules: schedules.map((schedule) => ({
          scheduleCode: schedule.appointmentCode,
          scheduleDate: schedule.appointmentDate,
          duration: schedule.duration,
          doctorCode: schedule.doctor?.code,
          doctorName: schedule.doctor?.name,
          procedureCode: schedule.procedure?.code,
          procedureName: schedule.procedure?.name,
          organizationUnitCode: schedule.organizationUnit?.code,
          organizationUnitName: schedule.organizationUnit?.name,
          organizationUnitAdress: schedule.organizationUnitAdress,
          insuranceCode: schedule.insurance?.code,
          insuranceName: schedule.insurance?.name,
          specialityCode: schedule.speciality?.code,
          specialityName: schedule.speciality?.name,
          insurancePlanCode: schedule.insurancePlan?.code,
          insurancePlanName: schedule.insurancePlan?.name,
          insuranceSubPlanCode: schedule.insuranceSubPlan?.code,
          insuranceSubPlanName: schedule.insuranceSubPlan?.name,
          planCategoryCode: schedule.planCategory?.code,
          planCategoryName: schedule.planCategory?.name,
          appointmentTypeCode: schedule.appointmentType?.code,
          appointmentTypeName: schedule.appointmentType?.name,
          occupationAreaCode: schedule.occupationArea?.code,
          occupationAreaName: schedule.occupationArea?.name,
          organizationUnitLocationCode: schedule.organizationUnitLocation?.code,
          organizationUnitLocationName: schedule.organizationUnitLocation?.name,
          typeOfServiceCode: schedule.typeOfService?.code,
          typeOfServiceName: schedule.typeOfService?.name,
          guidance: schedule.guidance,
          guidanceLink: schedule.guidanceLink,
          observation: schedule.observation,
          warning: schedule.warning,
          isFollowUp: schedule.isFollowUp,
          price: schedule.price?.value,
          data: schedule.data,
        })),
      };
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING-APPOINTMENTS:${integrationId}:listAvailableSchedules`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return null;
    }
  }

  public async getScheduleValue(integrationId: string, data: GetScheduleValueInput): Promise<GetScheduleValueOutput> {
    try {
      const getScheduleValue: GetScheduleValue = {
        insurance: {
          planCode: data.insurancePlanCode,
          subPlanCode: data.insuranceSubPlanCode,
          code: data.insuranceCode,
          planCategoryCode: data.planCategoryCode,
        },
        procedure: {
          specialityCode: data.specialityCode,
          specialityType: data.specialityType,
          code: data.procedureCode,
        },
        doctor: {
          code: data.doctorCode,
        },
        appointmentType: {
          code: data.appontmentTypeCode,
        },
        organizationUnit: {
          code: data.organizationUnitCode,
        },
        speciality: {
          code: data.specialityCode,
        },
        scheduleCode: data.scheduleCode,
        data: data.data,
      };

      const { currency, value } = await this.integratorService.getScheduleValue(integrationId, getScheduleValue);

      return { currency, value };
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING-APPOINTMENTS:${integrationId}:getScheduleValue`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return null;
    }
  }

  public async createSchedule(integrationId: string, data: CreateScheduleInput): Promise<CreateScheduleOutput> {
    try {
      const createSchedule: CreateSchedule = {
        patient: {
          code: data.patientErpCode,
          cpf: data.patientCpf,
          name: data.patientName,
          sex: data.patientSex,
          bornDate: data.patientBornDate,
          email: data.patientEmail,
          cellPhone: data.patientPhone,
          weight: data.patientWeight ? parseFloat(data.patientWeight) : undefined,
          height: data.patientHeight ? parseFloat(data.patientHeight) : undefined,
          data: data.data,
        },
        appointment: {
          duration: data.duration,
          appointmentDate: data.scheduleDate,
          code: data.scheduleCode,
        },
        insurance: {
          code: data.insuranceCode,
          planCode: data.insurancePlanCode,
          planCategoryCode: data.insurancePlanCategoryCode,
        },
        organizationUnit: {
          code: data.organizationUnitCode,
        },
        procedure: {
          code: data.procedureCode,
          specialityCode: data.specialityCode,
          specialityType: data.specialityType,
        },
        speciality: {
          code: data.specialityCode,
          specialityType: data.specialityType,
        },
        doctor: {
          code: data.doctorCode,
        },
        typeOfService: {
          code: data.typeOfServiceCode,
        },
        appointmentType: {
          code: data.appointmentTypeCode,
        },
        scheduleType: data.scheduleType as TypeOfService,
        data: null,
      };

      const appointment = await this.integratorService.createSchedule(integrationId, createSchedule);

      return {
        scheduleCode: appointment.appointmentCode,
        scheduleDate: appointment.appointmentDate,
        duration: appointment.duration,
        doctorCode: appointment.doctor?.code,
        doctorName: appointment.doctor?.name,
        procedureCode: appointment.procedure?.code,
        procedureName: appointment.procedure?.name,
        organizationUnitCode: appointment.organizationUnit?.code,
        organizationUnitName: appointment.organizationUnit?.name,
        organizationUnitAdress: appointment.organizationUnitAdress,
        insuranceCode: appointment.insurance?.code,
        insuranceName: appointment.insurance?.name,
        specialityCode: appointment.speciality?.code,
        specialityName: appointment.speciality?.name,
        insurancePlanCode: appointment.insurancePlan?.code,
        insurancePlanName: appointment.insurancePlan?.name,
        insuranceSubPlanCode: appointment.insuranceSubPlan?.code,
        insuranceSubPlanName: appointment.insuranceSubPlan?.name,
        planCategoryCode: appointment.planCategory?.code,
        planCategoryName: appointment.planCategory?.name,
        appointmentTypeCode: appointment.appointmentType?.code,
        appointmentTypeName: appointment.appointmentType?.name,
        occupationAreaCode: appointment.occupationArea?.code,
        occupationAreaName: appointment.occupationArea?.name,
        organizationUnitLocationCode: appointment.organizationUnitLocation?.code,
        organizationUnitLocationName: appointment.organizationUnitLocation?.name,
        typeOfServiceCode: appointment.typeOfService?.code,
        typeOfServiceName: appointment.typeOfService?.name,
        guidance: appointment.guidance,
        guidanceLink: appointment.guidanceLink,
        observation: appointment.observation,
        warning: appointment.warning,
        isFollowUp: appointment.isFollowUp,
        price: appointment.price?.value,
        data: appointment.data,
      };
    } catch (error) {
      Sentry.captureEvent({
        message: `ERROR:SCHEDULING-APPOINTMENTS:${integrationId}:createSchedule`,
        extra: {
          integrationId: integrationId,
          error: error,
        },
      });

      return null;
    }
  }
}
