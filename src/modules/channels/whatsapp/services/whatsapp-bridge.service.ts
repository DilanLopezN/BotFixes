import { Injectable } from '@nestjs/common';
import { WhatsappUtilService } from './whatsapp-util.service';
import { TemplateCategory } from '../../../template-message/schema/template-message.schema';
import { CompleteChannelConfig } from '../../../channel-config/channel-config.service';
import { UploadingFile } from '../../../../common/interfaces/uploading-file.interface';

@Injectable()
export class WhatsappBridgeService {
    constructor(private readonly whatsappUtilService: WhatsappUtilService) {}

    async createTemplateMetaWhatsapp(
        channelConfig: CompleteChannelConfig,
        name: string,
        category: TemplateCategory,
        template: any,
        fileData?: any,
        file?: UploadingFile,
        templateType?: any,
        allowTemplateCategoryChange?: boolean,
    ) {
        const service = await this.whatsappUtilService.getService(channelConfig);
        return await service.createTemplateMetaWhatsapp(
            channelConfig,
            name,
            category,
            template,
            fileData,
            file,
            templateType,
            allowTemplateCategoryChange,
        );
    }

    async createFlow(channelConfig: CompleteChannelConfig, flowData: { name: string; categories: string[] }) {
        const service = await this.whatsappUtilService.getService(channelConfig);
        return await service.createFlow(channelConfig, flowData);
    }

    async updateFlowJSON(channelConfig: CompleteChannelConfig, flowId: string, flowJSON: string) {
        const service = await this.whatsappUtilService.getService(channelConfig);
        return await service.updateFlowJSON(channelConfig, flowId, flowJSON);
    }

    async publishFlow(channelConfig: CompleteChannelConfig, flowId: string) {
        const service = await this.whatsappUtilService.getService(channelConfig);
        return await service.publishFlow(channelConfig, flowId);
    }

    async getPreviewFlowURL(channelConfig: CompleteChannelConfig, flowId: string) {
        const service = await this.whatsappUtilService.getService(channelConfig);
        // return await service.getPreviewFlowURL(channelConfig, flowId);
    }
}
