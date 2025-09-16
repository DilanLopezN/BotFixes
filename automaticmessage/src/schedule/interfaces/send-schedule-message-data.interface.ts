import { ScheduleMessage } from '../models/schedule-message.entity';
import { Schedule } from '../models/schedule.entity';
import { SendSchedule } from '../services/integration-api.service';
import { ScheduleGroupRule } from './schedule-group-rule.enum';
export enum ActiveMessageInternalActions {
  confirmacao = 'confirmacao',
  lembrete = 'lembrete',
  pesquisa_satisfacao = 'pesquisa_satisfacao',
  laudo_medico = 'laudo_medico',
  notificacao_agendamento = 'notificacao_agendamento',
  recuperacao_agendamento_perdido = 'recuperacao_agendamento_perdido',
  nps_avaliacao = 'nps_avaliacao',
  solicitacao_documentos = 'solicitacao_documentos',
  mkt_ativo = 'mkt_ativo',
}
export interface SendScheduleMessageSetting {
  id?: number;
  apiToken: string;
  templateId: string;
  retryInvalid?: boolean;
  groupRule?: ScheduleGroupRule;
  erpParams?: string;
  sendAction?: boolean;
  emailSendingSettingId?: number;
}
export interface SendScheduleMessageData {
  scheduleMessage: ScheduleMessage;
  schedule: Schedule;
  sendScheduleMessageSetting: SendScheduleMessageSetting;
  action: ActiveMessageInternalActions;
  orderedGroup?: Array<SendSchedule>;
}
