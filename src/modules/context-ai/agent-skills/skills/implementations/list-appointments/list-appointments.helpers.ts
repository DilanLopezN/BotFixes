import { Appointment } from './list-appointments.interfaces';

export class ListAppointmentsHelpers {
    static getRandomMessage(messages: string[]): string {
        return messages[Math.floor(Math.random() * messages.length)];
    }

    static formatAppointmentsMessage(appointments: Appointment[], includeActionHint: boolean = true): string {
        if (!appointments || appointments.length === 0) {
            return 'Não foram encontrados horários agendados para você.';
        }

        const formattedList = appointments
            .map((apt, index) => {
                const header = `➡️ Atendimento ${index + 1}`;
                return `${header}\n${this.formatAppointmentDetailed(apt)}`;
            })
            .join('\n\n');

        const actionHints = includeActionHint ? `\n\nO que você gostaria de fazer?` : '';

        return `Aqui estão seus horários agendados:\n\n${formattedList}${actionHints}`;
    }

    static formatAppointmentTime(appointmentDate: string): { date: string; time: string; dayOfWeek: string } {
        const date = new Date(appointmentDate);

        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            dayOfWeek: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        };
    }

    static formatAppointmentDetailed(apt: Appointment): string {
        const timeInfo = this.formatAppointmentTime(apt.appointmentDate);
        const location = apt.organizationUnit.data?.address || apt.organizationUnit.name;

        return `
📋 ${timeInfo.dayOfWeek}, ${timeInfo.date} às ${timeInfo.time}
👨‍⚕️ Profissional: ${apt.doctor.friendlyName}
🏥 Especialidade: ${apt.speciality.friendlyName}
📍 Local: ${location}
💳 Convênio: ${apt.insurance.friendlyName}`;
    }
}
