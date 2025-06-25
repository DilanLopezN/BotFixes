import { Interaction } from '../../../interactions/interfaces/interaction.interface';

export class ExternalDataMockService {
    async getInteractionsByBot(workspaceId: string, botId: string): Promise<Interaction[]> {
        return [];
    }
}
