interface IScheduleEvents {
  id: number;
  integrationId: string;
  shortId: string;
  type: ScheduleEventType;
  scheduleCode?: string;
  createdAt: Date;
}

enum ScheduleEventType {
  // Evento para tracker scroll realizado na tela de listar agendamentos
  viewSchedulesList = 'view_schedules_list',
  // Evento para tracker se usuário fez scroll na tela de orientações do agendamento
  guidanceView = 'guidance_view',
  cancelSchedule = 'cancel_schedule',
  confirmSchedule = 'confirm_schedule',
  // Evento para saber se usuário baixou laudo pela tela de agendamento
  downloadReport = 'download_report',
  // Eventos para upload de documento do agendamento
  downloadDocument = 'download_document',
  uploadDocument = 'upload_document',
  deleteDocument = 'delete_document',
}

export type { IScheduleEvents };
export { ScheduleEventType };
