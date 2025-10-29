import { ConversationStatus } from '~/constants/conversation-status';

export const getConversationStatusAttributesMap = () => {
  return {
    [ConversationStatus.Open]: { label: 'Aberto', hasPermission: true },
    [ConversationStatus.Closed]: { label: 'Fechado', hasPermission: true },
    [ConversationStatus.InProgress]: { label: 'Agendamentos não concluídos', hasPermission: true },
    [ConversationStatus.Redirected]: { label: 'Redirecionado', hasPermission: true },
    [ConversationStatus.Scheduled]: { label: 'Agendado', hasPermission: true },
    [ConversationStatus.WithoutEntities]: { label: 'Sem entidades', hasPermission: true },
    [ConversationStatus.WithoutSchedules]: { label: 'Sem horários', hasPermission: true },
    [ConversationStatus.Error]: { label: 'Erro', hasPermission: true },
  };
};
