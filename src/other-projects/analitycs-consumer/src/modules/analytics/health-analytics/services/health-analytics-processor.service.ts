import { Injectable, Logger } from '@nestjs/common';
import {
  IAppointmentSheduledEvent,
  IAppointmentStepData,
  IReasonForNotSchedulingData,
} from 'kissbot-core';
import {
  Appointment,
  AppointmentPeriod,
  AppointmentStatus,
  ChooseDoctor,
  ListPatientAppointmentStatus,
} from 'kissbot-entities';
import { isNil, omitBy } from 'lodash';
import * as moment from 'moment';
import { HealthAnalyticsService } from './health-analytics.service';

@Injectable()
export class HealthAnalyticsProcessorService {
  private readonly logger = new Logger(HealthAnalyticsProcessorService.name);
  constructor(private healthAnalyticsService: HealthAnalyticsService) {}

  public async processScheduledEvent(
    eventId: string,
    data: IAppointmentSheduledEvent,
  ) {
    try {
      const newAppointmentObj: Appointment = {
        appointmentStatus: AppointmentStatus.scheduled,
        botId: data.botId,
        channelId: data.channelId,
        conversationId: data.conversationId,
        integrationId: data.integrationId,
        workspaceId: data.workspaceId,
        timestamp: moment(data.timestamp).valueOf(),
        ctx_id: data.ctx_id,
        // chamar transformStepDataToAppointment aqui talvez
        ...omitBy<Partial<Appointment>>(
          {
            appointmentCode: data.appointmentCode ?? null,
            appointmentDate: data.appointmentDate ?? null,
            doctorCode: data.doctorCode ?? null,
            doctorName: data.doctorName ?? null,
            organizationUnitCode: data.organizationUnitCode ?? null,
            organizationUnitName: data.organizationUnitName ?? null,
            patientCode: data.patientCode,
            listPatientAppointmentStatus: this.getListPatientAppointmentStatus(
              data.listPatientAppointmentStatus,
            ),
            patientAge: data.patientBornDate
              ? moment().diff(data.patientBornDate, 'years')
              : null,
            chooseDoctor: this.getChooseDoctor(data.chooseDoctor),
          },
          isNil,
        ),
      };

      return await this.healthAnalyticsService.upsert(
        eventId,
        newAppointmentObj,
      );
    } catch (error) {
      this.logger.error(
        `HealthAnalyticsProcessorService.processScheduledEvent: ${error}`,
      );
    }
  }

  public async processAppointmentStepEvent(
    eventId: string,
    data: IAppointmentStepData,
  ) {
    try {
      const appointmentObj = this.transformStepDataToAppointment(data);
      return await this.healthAnalyticsService.upsert(eventId, appointmentObj);
    } catch (error) {
      this.logger.error(
        `HealthAnalyticsProcessorService.processAppointmentStepEvent: ${error}`,
      );
    }
  }

  public async processAppointmentAvailabilityEvent(
    eventId: string,
    data: IAppointmentStepData,
  ) {
    try {
      const appointmentObj = this.transformStepDataToAppointment(data);
      return await this.healthAnalyticsService.upsert(eventId, appointmentObj);
    } catch (error) {
      this.logger.error(
        `HealthAnalyticsProcessorService.processAppointmentAvailabilityEvent: ${error}`,
      );
    }
  }

  public async processScheduledDefaultDataEvent(
    eventId: string,
    data: IAppointmentStepData,
    status: AppointmentStatus,
  ) {
    try {
      const appointmentObj = this.transformStepDataToAppointment(data);
      const newAppointmentObj: Appointment = {
        ...appointmentObj,
        appointmentStatus: status,
        botId: data.botId,
        channelId: data.channelId,
        conversationId: data.conversationId,
        integrationId: data.integrationId,
        workspaceId: data.workspaceId,
        timestamp: moment(data.timestamp).valueOf(),
      };

      return await this.healthAnalyticsService.upsert(
        eventId,
        newAppointmentObj,
      );
    } catch (error) {
      this.logger.error(
        `HealthAnalyticsProcessorService.processScheduledDefaultDataEvent: ${error}`,
      );
    }
  }

  public async processScheduledWithoutAvailabilityEvent(
    eventId: string,
    data: IAppointmentStepData,
  ) {
    return await this.processScheduledDefaultDataEvent(
      eventId,
      data,
      AppointmentStatus.withoutSchedules,
    );
  }

  public async processScheduledWithoutEntities(
    eventId: string,
    data: IAppointmentStepData,
  ) {
    return await this.processScheduledDefaultDataEvent(
      eventId,
      data,
      AppointmentStatus.withoutEntities,
    );
  }

  public async processScheduledRedirected(
    eventId: string,
    data: IAppointmentStepData,
  ) {
    return await this.processScheduledDefaultDataEvent(
      eventId,
      data,
      AppointmentStatus.redirected,
    );
  }

  public async processScheduleReasonCreated(
    eventId: string,
    data: IReasonForNotSchedulingData,
  ) {
    try {
      const newAppointmentObj: Partial<Appointment> = {
        ctx_id: data.ctx_id,
        reasonName: data.reasonName,
        reasonCode: data.reasonCode,
        reasonText: data.reasonText,
        botId: data.botId,
        channelId: data.channelId,
        conversationId: data.conversationId,
        integrationId: data.integrationId,
        workspaceId: data.workspaceId,
        timestamp: moment(data.timestamp).valueOf(),
      };

      return await this.healthAnalyticsService.updateByCtxId(
        eventId,
        newAppointmentObj,
      );
    } catch (error) {
      this.logger.error(
        `HealthAnalyticsProcessorService.processScheduleReasonCreated: ${error}`,
      );
    }
  }

  private getChooseDoctor(code: string) {
    switch (code) {
      case 'true':
        return ChooseDoctor.yes;

      case 'false':
        return ChooseDoctor.no;

      case 'unknow':
        return ChooseDoctor.unknow;

      default:
        return null;
    }
  }

  private getPeriodOfDay(code: string) {
    switch (code) {
      case 'manha':
        return AppointmentPeriod.morning;

      case 'tarde':
        return AppointmentPeriod.afternoon;

      case 'indiferente':
        return AppointmentPeriod.indifferent;

      default:
        return null;
    }
  }

  private getListPatientAppointmentStatus(code: number) {
    switch (code) {
      case -1:
        return null;

      case 0:
        return ListPatientAppointmentStatus.error;

      case 1:
        return ListPatientAppointmentStatus.success;

      default:
        return null;
    }
  }

  private transformStepDataToAppointment(data: IAppointmentStepData) {
    try {
      const requiredFields: Appointment = {
        botId: data.botId,
        channelId: data.channelId,
        conversationId: data.conversationId,
        integrationId: data.integrationId,
        workspaceId: data.workspaceId,
        timestamp: moment(data.timestamp).valueOf(),
        appointmentStatus: AppointmentStatus.inProgress,
        ctx_id: data.ctx_id ?? data.conversationId,
      };

      const optionalFields: Partial<Appointment> = omitBy(
        {
          doctorCode: data.doctorCode ?? null,
          doctorName: data.doctorName ?? null,
          insuranceCode: data.insuranceCode ?? null,
          insuranceName: data.insuranceName ?? null,
          procedureCode: data.procedureCode ?? null,
          procedureName: data.procedureName ?? null,
          specialityCode: data.specialityCode ?? null,
          specialityName: data.specialityName ?? null,
          insurancePlanCode: data.insurancePlanCode ?? null,
          insurancePlanName: data.insurancePlanName ?? null,
          organizationUnitCode: data.organizationUnitCode ?? null,
          organizationUnitName: data.organizationUnitName ?? null,
          insuranceCategoryCode: data.insuranceCategoryCode ?? null,
          insuranceCategoryName: data.insuranceCategoryName ?? null,
          insuranceSubPlanCode: data.insuranceSubPlanCode ?? null,
          insuranceSubPlanName: data.insuranceSubPlanName ?? null,
          appointmentTypeName: data.appointmentTypeName ?? null,
          appointmentTypeCode: data.appointmentTypeCode ?? null,
          typeOfServiceCode: data.typeOfServiceCode ?? null,
          typeOfServiceName: data.typeOfServiceName ?? null,
          occupationAreaCode: data.occupationAreaCode ?? null,
          occupationAreaName: data.occupationAreaName ?? null,
          organizationUnitLocationCode:
            data.organizationUnitLocationCode ?? null,
          organizationUnitLocationName:
            data.organizationUnitLocationName ?? null,
          referenceScheduleType: data.referenceScheduleType ?? null,
          referenceTypeOfService: data.referenceTypeOfService ?? null,
          price: data.price ? String(data.price) : null,
          periodOfDay: data.chosenPeriodOfDay
            ? this.getPeriodOfDay(data.chosenPeriodOfDay)
            : null,
          lastPatientAppointmentDate: data.lastUserAppointmentTimestamp ?? null,
          lastPatientAppointmentType: data.lastUserAppointmentType ?? null,
          nextPatientAppointmentDate: data.nextUserAppointmentTimestamp ?? null,
          nextPatientAppointmentType: data.nextUserAppointmentType ?? null,
          fromDate: data.fromDateTimestamp ?? null,
          untilDate: data.untilDateTimestamp ?? null,
          patientCode: data.patientCode ?? null,
          avaliableDateCount: data.avaliableDateCount ?? null,
          firstAvaliableDate: data.firstAvaliableDate ?? null,
          firstAvaliableDateDistance: !!data.firstAvaliableDate
            ? Math.round(
                moment
                  .duration(
                    moment(data.firstAvaliableDate).utc().diff(moment()),
                  )
                  .asDays(),
              )
            : null,
          appointmentConfirmed:
            typeof data.confirmedAppointment === 'boolean'
              ? Number(data.confirmedAppointment)
              : null,
          listPatientAppointmentStatus: this.getListPatientAppointmentStatus(
            data.listPatientAppointmentStatus,
          ),
          step: data.step,
          patientAge: data.patientBornDate
            ? moment().diff(data.patientBornDate, 'years')
            : null,
          chooseDoctor: this.getChooseDoctor(data.chooseDoctor),
          abTestName: data.abTestName ?? null,
        } as Partial<Appointment>,
        isNil,
      );

      return {
        ...optionalFields,
        ...requiredFields,
      };
    } catch (error) {
      console.log(
        'HealthAnalyticsProcessorService.transformStepDataToAppointment',
        error,
      );
    }
  }
}
