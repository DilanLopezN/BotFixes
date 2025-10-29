import { ActionKey } from '../../../../conversational-agents/interfaces/conversational-agent.interface';
import { Appointment } from './list-appointments.interfaces';
import { ListAppointmentsHelpers } from './list-appointments.helpers';

export class ListAppointmentsMessages {
    private static readonly CPF_MESSAGES = [
        'Pra localizar seus agendamentos com segurança, por favor digite o número do seu CPF.',
        'Preciso que você digite o CPF cadastrado pra encontrar seus horários:',
        'Para continuar, preciso confirmar seu CPF cadastrado. Digite o número completo:',
    ];

    private static readonly BIRTH_DATE_MESSAGES = [
        'Agora preciso que você digite sua data de nascimento pra confirmar seus dados.',
        'Certo! Digite sua data de nascimento pra eu validar suas informações.',
        'Perfeito! Pra confirmar seu cadastro, digite sua data de nascimento.',
    ];

    private static readonly CANCEL_MESSAGES = [
        'Tudo bem, não tem problema 😊 Posso ajudar com mais alguma coisa?',
        'Certo, entendi! Deseja ver outra informação ou encerrar por aqui?',
        'Sem problemas! Caso queira, posso te ajudar com outra dúvida.',
    ];

    private static getRandomMessage(messages: string[]): string {
        return messages[Math.floor(Math.random() * messages.length)];
    }

    static getRandomCpfMessage(): string {
        return this.getRandomMessage(this.CPF_MESSAGES);
    }

    static getRandomBirthDateMessage(): string {
        return this.getRandomMessage(this.BIRTH_DATE_MESSAGES);
    }

    static getRandomCancelMessage(): string {
        return this.getRandomMessage(this.CANCEL_MESSAGES);
    }

    static getErrorFetchingAppointments(): string {
        return 'Ah, que pena não consegui acessar seus horários neste momento.Você Pode tentar novamente em alguns instantes.\nDeseja que eu te ajude com outra informação?';
    }

    static getErrorProcessingAction(): string {
        return 'Ocorreu um erro ao buscar seus horários. Tente novamente.';
    }

    static getErrorCancelingAppointments(): string {
        return 'Ocorreu um erro ao cancelar os agendamentos. Tente novamente.';
    }

    static getErrorConfirmingAppointments(): string {
        return 'Ocorreu um erro ao confirmar os agendamentos. Tente novamente.';
    }

    static getErrorExecutingMultipleActions(): string {
        return 'Ocorreu um erro ao processar as ações. Tente novamente.';
    }

    static getGenericError(): string {
        return 'Ocorreu um erro. Por favor, tente novamente.';
    }

    static getErrorNoAppointments(): string {
        return 'Não há agendamentos disponíveis para realizar ações.';
    }

    static getErrorAppointmentsNotFound(): string {
        return 'Não foi possível encontrar os agendamentos especificados.';
    }

    static getErrorCannotProcessAction(): string {
        return 'Não consegui processar essa ação. Como posso ajudá-lo?';
    }

    static getErrorCpfNotIdentified(): string {
        return 'Não consegui identificar seu CPF após algumas tentativas. Tente novamente mais tarde.';
    }

    static getErrorBirthDateNotIdentified(): string {
        return 'Não consegui identificar sua data de nascimento após algumas tentativas. Tente novamente mais tarde.';
    }

    static getActionNotUnderstood(): string {
        return 'Desculpe, não entendi o que você gostaria de fazer. Você pode:\n\n• Cancelar um agendamento: "cancelar 1" ou "cancelar todos"\n• Confirmar um agendamento: "confirmar 2" ou "confirmar todos"\n• Múltiplas ações: "cancela o ginecologia e confirma a neurologista"\n\nQual ação você deseja realizar?';
    }

    static getSpecifyAppointmentToAction(actionWord: string): string {
        return `Por favor, especifique qual(is) agendamento(s) deseja ${actionWord}. Por exemplo: "${actionWord} 1" ou "${actionWord} todos"`;
    }

    static getClarifyConfirmation(): string {
        return 'Por favor, responda "sim" para confirmar ou "não" para cancelar a operação.';
    }

    static getOperationCancelled(): string {
        return 'Operação cancelada. Os agendamentos continuam como estavam.\n\nPosso ajudar com algo mais?';
    }

    static getAppointmentsCancelled(count: number): string {
        const plural = count > 1;
        const text = plural ? 'Agendamentos cancelados' : 'Agendamento cancelado';
        return `${text} com sucesso.\n\nPosso ajudar com algo mais?`;
    }

    static getAppointmentsConfirmed(count: number): string {
        const plural = count > 1;
        const text = plural ? 'Agendamentos confirmados' : 'Agendamento confirmado';
        return `${text} com sucesso.\n\nPosso ajudar com algo mais?`;
    }

    static getMultipleActionsExecuted(): string {
        return 'Ações executadas com sucesso.\n\nPosso ajudar com algo mais?';
    }

    static getNoActionsExecuted(): string {
        return 'Nenhuma ação foi realizada.';
    }

    static getCancelConfirmationMessage(appointmentsList: string, plural: boolean): string {
        const text = plural
            ? 'Você está prestes a CANCELAR os seguintes agendamentos'
            : 'Você está prestes a CANCELAR o seguinte agendamento';
        return `${text}:\n\n${appointmentsList}\n\nDeseja confirmar o cancelamento?`;
    }

    static getConfirmConfirmationMessage(appointmentsList: string, plural: boolean): string {
        const text = plural
            ? 'Você está prestes a CONFIRMAR os seguintes agendamentos'
            : 'Você está prestes a CONFIRMAR o seguinte agendamento';
        return `${text}:\n\n${appointmentsList}\n\nDeseja confirmar?`;
    }

    static getMultipleActionsConfirmationMessage(sections: string[]): string {
        return `Você está prestes a realizar as seguintes ações:\n\n${sections.join(
            '\n\n',
        )}\n\nDeseja confirmar todas essas ações?`;
    }

    static getSuggestedActions() {
        return [
            { label: 'Agendar', value: 'quero agendar', type: ActionKey.MESSAGE },
            { label: 'Ver Agendamentos', value: 'ver meus agendamentos', type: ActionKey.MESSAGE },
        ];
    }

    static getConfirmationActions() {
        return [
            { label: 'Sim', value: 'sim', type: ActionKey.MESSAGE },
            { label: 'Não', value: 'não', type: ActionKey.MESSAGE },
        ];
    }

    static getCancelActionText(plural: boolean): string {
        return `CANCELAR ${plural ? 'os seguintes agendamentos' : 'o seguinte agendamento'}`;
    }

    static getConfirmActionText(plural: boolean): string {
        return `CONFIRMAR ${plural ? 'os seguintes agendamentos' : 'o seguinte agendamento'}`;
    }

    static getWhichOneToAction(actionWord: string): string {
        return `Qual deles você deseja ${actionWord}?`;
    }

    static getActionWord(action: string): string {
        return action === 'cancel' ? 'cancelar' : 'confirmar';
    }

    static formatAppointmentsList(appointments: Appointment[], indices: number[]): string {
        return appointments
            .map((apt, idx) => {
                const appointmentIndex = indices[idx];
                const header = `➡️ Atendimento ${appointmentIndex}`;
                return `${header}\n${ListAppointmentsHelpers.formatAppointmentDetailed(apt)}`;
            })
            .join('\n\n');
    }

    static getAppointmentsListMessage(
        appointments: Appointment[],
        intentDetection?: { hasIntent: boolean; confidence: number; action?: string },
    ): string {
        if (intentDetection?.hasIntent && intentDetection.confidence > 0.7 && intentDetection.action) {
            const actionWord = this.getActionWord(intentDetection.action);
            const appointmentsMessage = ListAppointmentsHelpers.formatAppointmentsMessage(appointments, false);
            return `${appointmentsMessage}\n\n${this.getWhichOneToAction(actionWord)}`;
        }

        return ListAppointmentsHelpers.formatAppointmentsMessage(appointments);
    }
}
