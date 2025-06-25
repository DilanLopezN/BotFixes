import { IntentsInterface } from '../../../intents/interfaces/intents.interface';

export class ExternalDataMockService {
    async getIntentsByWorkspaceIdAndBotId(workspaceId: string, botId: string): Promise<IntentsInterface[]> {
        return [
            {
                name: 'Teste1',
                label: 'teste1',
                attributes: [
                    {
                        label: '1',
                        name: '1',
                        value: '1',
                    },
                ],
            },
            {
                name: 'Teste2',
                label: 'teste2',
                attributes: [
                    {
                        label: '2',
                        name: '2',
                        value: '2',
                    },
                ],
                canDuplicateContext: true,
            },
        ];
    }
}
