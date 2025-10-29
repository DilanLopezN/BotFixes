import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IAgent } from '../../../../agent/interfaces/agent.interface';
import { Doctor } from './list-doctors.interfaces';

@Injectable()
export class ListDoctorsApi {
    private readonly logger = new Logger(ListDoctorsApi.name);

    constructor(private readonly httpService: HttpService) {}

    async fetchDoctors(agent: IAgent): Promise<Doctor[]> {
        const baseUrl = process.env.INTEGRATIONS_URI;
        const url = `${baseUrl}/integration/${agent.integrationId}/health/integrator/entities`;

        const headers: Record<string, string> = {
            Authorization: `Bearer ${process.env.API_TOKEN}`,
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post<{ data: Doctor[] }>(
                    url,
                    {
                        targetEntity: 'doctor',
                        filter: {
                            appointmentType: { code: 'C' },
                        },
                        version: 'production',
                        cache: true,
                    },
                    {
                        timeout: 4_000,
                        headers,
                    },
                ),
            );

            return response.data?.data || [];
        } catch (error) {
            this.logger.error('Error fetching doctors:', error);
            throw error;
        }
    }
}
