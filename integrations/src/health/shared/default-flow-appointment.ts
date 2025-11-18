import * as moment from 'moment';
import { FlowAction, FlowActionRules, FlowActionType } from '../flow/interfaces/flow.interface';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import { Appointment } from '../interfaces/appointment.interface';

export const getDefaultPatientAppointmentFlow = (
  appointment: Appointment,
  integration: IntegrationDocument,
): FlowAction<FlowActionRules> | undefined => {
  const flowAction: FlowAction<FlowActionRules> = {
    element: {},
    type: FlowActionType.rules,
  };

  if (appointment.canCancel !== undefined) {
    flowAction.element.canNotCancel = !appointment.canCancel;
  }

  if (appointment.canConfirm !== undefined) {
    flowAction.element.canNotConfirmActive = !appointment.canConfirm;
    flowAction.element.canNotConfirmPassive = !appointment.canConfirm;
  }

  // se a regra estiver ativa, não se pode cancelar um agendamento 24h antes do horário marcado
  if (integration.rules?.doNotCancelBefore24hours) {
    const scheduleDate = moment(appointment?.appointmentDate).utc();
    const date24hFromNow = moment.utc().add(24, 'hours');

    if (date24hFromNow > scheduleDate) {
      flowAction.element.canNotCancel = true;
    }
  }

  if (!Object.keys(flowAction.element).length) {
    return undefined;
  }

  return {
    ...flowAction,
    element: {
      ...flowAction.element,
      priority: 1,
    },
  };
};
