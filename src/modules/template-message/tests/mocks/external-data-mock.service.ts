import { ChannelConfig } from "../../../channel-config/interfaces/channel-config.interface";
import { TemplateCategory } from "../../../channels/gupshup/services/partner-api.service";
import { TemplateMessage } from "../../interface/template-message.interface";

export class ExternalDataMockService {

    async getChannelConfigByWorkspaceIdAndGupshup(workspaceId: string): Promise<ChannelConfig[]> {
        return []
    }

    async getOneByToken(channelConfigToken: string) {
        return {
            
        }
    }

    async createTemplateGupshup(appName: string, channelConfigId: string, template: TemplateMessage, category?: TemplateCategory): Promise<any> {
    }

    async deleteTemplateGupshup(appName: string, elementName: string) {
    }

    async getWorkspace(workspaceId: string) {
    }

    async getTeamsByWorkspaceAndUser(workspaceId: string, userId: string) {
    }
}