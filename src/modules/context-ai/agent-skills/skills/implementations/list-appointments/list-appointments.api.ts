import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IAgent } from '../../../../agent/interfaces/agent.interface';
import { DateFormatUtil } from '../../../../../../common/utils/date-format.util';
import { Appointment } from './list-appointments.interfaces';

@Injectable()
export class ListAppointmentsApi {
    private readonly logger = new Logger(ListAppointmentsApi.name);

    constructor(private readonly httpService: HttpService) {}

    async fetchPatientAppointments(agent: IAgent, cpf: string, birthDate: string): Promise<Appointment[]> {
        const baseUrl = process.env.INTEGRATIONS_URI;
        const apiToken = process.env.API_TOKEN;

        const headers: Record<string, string> = {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        };

        const formattedBirthDate = DateFormatUtil.formatToISODate(birthDate);

        const appointmentsUrl = `${baseUrl}/integration/${agent.integrationId}/health/patient-appointments-by-cpf`;
        const appointmentsPayload = {
            startDate: Date.now(),
            specialityCode: '',
            patient: {
                bornDate: formattedBirthDate,
                cpf,
            },
        };

        try {
            const appointmentsResponse = await firstValueFrom(
                this.httpService.post<Appointment[]>(appointmentsUrl, appointmentsPayload, {
                    headers,
                    timeout: 6_000,
                }),
            );

            return appointmentsResponse.data || [];
        } catch (error) {
            this.logger.error(`[ListAppointments] Request error: ${error.message}`);
            throw error;
        }
    }
}
