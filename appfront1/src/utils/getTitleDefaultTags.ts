export const getTitleDefaultTags = (tagName: string) => {
    if (tagName.startsWith('@bot')) {
        switch (tagName) {
            case '@bot.reagendamento':
                return {
                    tag: tagName,
                    message: 'Paciente possuía agendamentos e optou por reagendar um deles',
                };
            case '@bot.agendamento':
                return { tag: tagName, message: 'Foi criado um ou mais agendamentos durante o atendimento' };
            case '@bot.visualiza':
                return { tag: tagName, message: 'Paciente visualizou seus agendamentos durante o atendimento' };
            case '@bot.cancela':
                return { tag: tagName, message: 'Paciente cancelou um ou mais agendamentos durante o atendimento' };
            case '@bot.confirma':
                return { tag: tagName, message: 'Paciente confirmou um ou mais agendamentos durante o atendimento' };
            case '@bot.paciente.dados.incorretos':
                return {
                    tag: tagName,
                    message:
                        'O paciente digitou incorretamente seus dados (data de nascimento) e não foi possível dar sequência no agendamento',
                };
            case '@bot.cadastro':
                return {
                    tag: tagName,
                    message:
                        'Paciente não possuía cadastro dentro do sistema, então foi solicitado mais dados para o cadastro.',
                };
            default:
                return { tag: tagName };
        }
    }
    return { tag: tagName };
};
