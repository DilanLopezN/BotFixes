import { Injectable, Logger } from '@nestjs/common';
import { CatchError } from '../../auth/exceptions';
import { IntentsInterface } from '../interfaces/intents.interface';

@Injectable()
export class IntentsService {
    private readonly logger = new Logger(IntentsService.name);
    constructor() {}

    @CatchError()
    async getIntentsByWorkspaceAndBot(workspaceId: string, botId: string): Promise<IntentsInterface[]> {
        return [
            {
                name: 'agendar',
                label: 'Agendar',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'agendar_consulta',
                label: 'Agendar Consulta',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'agendar_exame',
                label: 'Agendar Exame',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'cancelar_agendamento',
                label: 'Cancelar Agendamento',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'cancelar_consulta',
                label: 'Cancelar Consulta',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'cancelar_exame',
                label: 'Cancelar Exame',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'reagendar',
                label: 'Reagendar',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'reagendar_consulta',
                label: 'Reagendar Consulta',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'reagendar_exame',
                label: 'Reagendar Exame',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'doacao_sangue',
                label: 'Doação de Sangue',
                attributes: [],
                // canDuplicateContext: true,
            },
            {
                name: 'resultado_exames',
                label: 'Resultado de Exames',
                attributes: [],
                // canDuplicateContext: true,
            }
        ];
    }
}
