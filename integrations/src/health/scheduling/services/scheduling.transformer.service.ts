import { Injectable } from '@nestjs/common';
import { ScheduleResume, ScheduleStatus } from '../interfaces/schedule-resume.interface';
import { Appointment, AppointmentStatus } from '../../interfaces/appointment.interface';
import { IIntegration } from '../../integration/interfaces/integration.interface';
import * as moment from 'moment';

@Injectable()
export class SchedulingTransformerService {
  private transformAppointmentStatus(appointment: Appointment): ScheduleStatus {
    const { status } = appointment;

    switch (status) {
      case AppointmentStatus.confirmed:
        return ScheduleStatus.confirmed;

      case AppointmentStatus.canceled:
        return ScheduleStatus.canceled;

      case AppointmentStatus.finished:
        return ScheduleStatus.finished;

      default: {
        if (moment().startOf('day').valueOf() > moment(appointment.appointmentDate).valueOf()) {
          return ScheduleStatus.finished;
        }

        return ScheduleStatus.scheduled;
      }
    }
  }

  public transformPatientSchedule(integration: IIntegration, schedule: Appointment): ScheduleResume {
    const { scheduling } = integration;

    const { hoursBeforeAppointmentToAllowConfirmation = null, enableScheduleConfirmation = false } =
      scheduling?.config?.resources?.confirmation ?? {};
    const { hoursBeforeAppointmentToAllowCancellation = null, enableScheduleCancellation = false } =
      scheduling?.config?.resources?.cancellation ?? {};
    const { hoursBeforeAppointmentToAllowRescheduling = null, enableScheduleRescheduling = false } =
      scheduling?.config?.resources?.rescheduling ?? {};

    const data: ScheduleResume = {
      scheduleCode: schedule.appointmentCode,
      scheduleDate: schedule.appointmentDate,
      status: this.transformAppointmentStatus(schedule),
      organizationUnitAddress:
        schedule.organizationUnitAdress || (schedule.organizationUnit?.data as any)?.address || null,
      organizationUnitName: schedule.organizationUnit?.friendlyName || null,
      procedureName: schedule.procedure?.friendlyName || null,
      specialityName: schedule.speciality?.friendlyName || null,
      doctorName: schedule?.doctor?.friendlyName || null,
      scheduleTypeName: schedule?.appointmentType?.friendlyName || null,
      scheduleTypeCode: schedule?.appointmentType?.params?.referenceScheduleType || null,
      guidance: schedule.guidance || null,
      observation: schedule.observation || null,
      permissions: {
        allowConfirm: enableScheduleConfirmation,
        allowCancel: enableScheduleCancellation,
        allowReschedule: enableScheduleRescheduling,
      },
      data: schedule.data,
    };

    if (moment().utc().valueOf() > moment(schedule.appointmentDate).utc().valueOf()) {
      data.permissions.allowConfirm = false;
      data.permissions.allowCancel = false;
      data.permissions.allowReschedule = false;

      return data;
    }

    const diffScheduleToNowHours = moment(schedule.appointmentDate).diff(moment(), 'hours');

    if (
      hoursBeforeAppointmentToAllowConfirmation &&
      diffScheduleToNowHours > hoursBeforeAppointmentToAllowConfirmation
    ) {
      data.permissions.allowConfirm = false;
    }

    if (
      hoursBeforeAppointmentToAllowCancellation &&
      diffScheduleToNowHours > hoursBeforeAppointmentToAllowCancellation
    ) {
      data.permissions.allowCancel = false;
    }

    if (
      hoursBeforeAppointmentToAllowRescheduling &&
      diffScheduleToNowHours > hoursBeforeAppointmentToAllowRescheduling
    ) {
      data.permissions.allowReschedule = false;
    }

    return data;
  }
}
