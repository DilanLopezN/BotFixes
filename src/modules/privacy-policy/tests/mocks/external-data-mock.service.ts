export class ExternalDataMockService {
    async updateInteractionWelcome(workspaceId: string): Promise<{ ok: boolean }> {
        return { ok: true };
    }

    async getChannelConfigByIdOrToken(channelConfigId: string) {
        return { _id: channelConfigId };
    }
}
