export const createNewFormId = 'create-new-team-form';

const defaultServicePeriod = [
  {
    start: undefined,
    end: undefined,
  },
];

export const formInitialValues = {
  priority: -1,
  reassignConversationInterval: 0,
  viewPublicDashboard: true,
  assignMessage: `Agradecemos pelas informações! O seu atendimento foi transferido para um de nossos atendentes.

Como o fluxo de mensagens é grande, talvez ocorra demora no tempo de espera para uma resposta.

Agradecemos sua compreensão!

*Fique atento ao seu whatsapp* 😊`,
  cannotAssignMessage: `Olá! Agradecemos o seu contato

No momento não temos atendentes disponível, mas não se preocupe!

Sua mensagem ficou registrada e será respondida assim que um dos atendentes iniciar o horário de expediente de segunda a sexta-feira é das 06:00 às 19:00 horas e sábado das 07:00 às 13:00 horas.

Obrigado!`,
  attendancePeriods: {
    sun: defaultServicePeriod,
    mon: defaultServicePeriod,
    tue: defaultServicePeriod,
    wed: defaultServicePeriod,
    thu: defaultServicePeriod,
    fri: defaultServicePeriod,
    sat: defaultServicePeriod,
  },
};
