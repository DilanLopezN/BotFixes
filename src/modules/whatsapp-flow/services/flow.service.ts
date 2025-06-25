import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WHATSAPP_FLOW_CONNECTION } from '../ormconfig';
import { Flow } from '../models/flow.entity';
import { Exceptions } from '../../auth/exceptions';
import { WhatsappFlowLibraryService } from './whatsapp-flow-library.service';
import { FlowCategoryService } from './flow-category.service';
import { FlowStatusEnum } from '../interfaces/flow.interface';
import { FlowDataService } from './flow-data.service';
import { TemplateMessage } from '../../template-message/interface/template-message.interface';
import { TemplateLanguage } from '../../channels/gupshup/services/partner-api.service';
import { castObjectId } from '../../../common/utils/utils';
import { TemplateButtonType } from '../../template-message/schema/template-message.schema';
import { ExternalDataService } from './external-data.service';

@Injectable()
export class FlowService {
    private readonly logger = new Logger(FlowService.name);

    constructor(
        @InjectRepository(Flow, WHATSAPP_FLOW_CONNECTION)
        private repository: Repository<Flow>,
        private readonly whatsappFlowLibraryService: WhatsappFlowLibraryService,
        private readonly flowCategoryService: FlowCategoryService,
        private readonly flowDataService: FlowDataService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async create(
        workspaceId: string,
        data: {
            channelConfigId: string;
            flowLibraryId: number;
            flowData: Record<string, any>;
        },
        userId: string,
    ) {
        const { channelConfigId, flowLibraryId, flowData } = data;
        const servicePartner = this.externalDataService;

        const { data: flowLibraryModel } = await this.whatsappFlowLibraryService.getWhatsappFlowLibraryById(
            flowLibraryId,
        );

        if (!flowLibraryModel) {
            throw Exceptions.NOT_FOUND_FLOW_LIBRARY;
        }

        const newFlowData = {};
        if (flowLibraryModel.variablesOfFlowData?.length) {
            for (const currVariable of flowLibraryModel.variablesOfFlowData) {
                const key = currVariable.value;
                newFlowData[key] = flowData?.[key] || '';
            }
        }

        let categories: string[] = [];

        if (flowLibraryModel?.flowCategoryIds?.length) {
            const flowCategories = await this.flowCategoryService.getFlowCategoryByIds(
                flowLibraryModel.flowCategoryIds,
            );

            if (flowCategories?.length) {
                categories = flowCategories.map((currFlowCategory) => currFlowCategory.category);
            }
        } else {
            categories = ['OTHER'];
        }

        let { result: flow } = await servicePartner.createFlow(channelConfigId, {
            name: flowLibraryModel.name,
            categories: categories,
        });

        if (!flow?.id) {
            throw Exceptions.ERRO_CREATE_FLOW;
        }

        await servicePartner.updateFlowJSON(channelConfigId, flow.id, JSON.stringify(flowLibraryModel.flowJSON));

        const flowResult = await this.repository.save({
            workspaceId: workspaceId,
            channelConfigId: channelConfigId,
            flowLibraryId: flowLibraryId,
            flowId: flow.id,
            flowName: flowLibraryModel.name,
            flowFields: flowLibraryModel.flowFields,
            status: FlowStatusEnum.DRAFT,
            active: true,
        });

        const firstScreenId = flowLibraryModel.flowJSON.screens?.[0]?.id || 'RECOMMEND';
        const flowDataResult = await this.flowDataService.create({
            flowId: flowResult.id,
            workspaceId,
            data: newFlowData,
            flowScreen: firstScreenId,
            name: flowLibraryModel.friendlyName,
        });

        const published = await servicePartner.publishFlow(channelConfigId, flow.id);

        if (!!published?.success) {
            await this.repository.update({ id: flowResult.id }, { status: FlowStatusEnum.PUBLISHED });
        }

        if (flowLibraryModel?.templateMessageData?.message) {
            const newTemplateMessage: Partial<TemplateMessage> = {
                workspaceId: workspaceId,
                userId: castObjectId(userId),
                name: flowLibraryModel.templateMessageData.name || `template ${flowLibraryModel.name}`,
                isHsm: false,
                message: flowLibraryModel.templateMessageData.message,
                active: true,
                languageCode: TemplateLanguage.pt_BR,
                channels: [castObjectId(data.channelConfigId) as string],
                canEdit: false,
                tags: [],
                teams: [],
                variables: flowLibraryModel.templateMessageData.variables,
                buttons: [
                    {
                        text: 'Acessar',
                        ...(flowLibraryModel?.templateMessageData?.buttons?.[0] || {}),
                        type: TemplateButtonType.FLOW,
                        flowName: flowLibraryModel.name,
                        flowDataId: flowDataResult.id,
                    },
                ],
            };

            await this.externalDataService.createTemplateMessage(newTemplateMessage);
        }

        return { success: true, data: { ...flowData, flow: flowResult } };
    }

    async updateFlowDataByFlowId(flowId: number, flowData: Record<string, any>) {
        const flowResult = await this.getFlowById(flowId);

        if (!flowResult) {
            throw Exceptions.NOT_FOUND_FLOW;
        }

        const { data: flowLibraryModel } = await this.whatsappFlowLibraryService.getWhatsappFlowLibraryById(
            flowResult.flowLibraryId,
        );

        if (!flowLibraryModel) {
            throw Exceptions.NOT_FOUND_FLOW_LIBRARY;
        }

        const newFlowData = {};
        if (flowLibraryModel.variablesOfFlowData?.length) {
            for (const currVariable of flowLibraryModel.variablesOfFlowData) {
                const key = currVariable.value;
                newFlowData[key] = flowData?.[key] || '';
            }
        }

        const flowDataResult = await this.flowDataService.updateDataByFlowId(flowResult.id, newFlowData);

        return { success: true, data: flowDataResult };
    }

    async getFlowByWorkspaceId(workspaceId: string) {
        return await this.repository.find({ workspaceId });
    }

    async getFlowById(id: number) {
        return await this.repository.findOne(id);
    }

    async getFlowByFlowLibraryId(flowLibraryId: number) {
        return await this.repository.findOne(undefined, { where: { flowLibraryId } });
    }

    async getFlowByChannelAndWorkspaceAndId(workspaceId: string, channelConfigId: string, flowId: number) {
        return await this.repository.findOne(undefined, { where: { workspaceId, channelConfigId, id: flowId } });
    }

    async publishFlow(workspaceId: string, channelConfigId: string, flowId: number) {
        const servicePartner = this.externalDataService;

        const flow = await this.getFlowByChannelAndWorkspaceAndId(workspaceId, channelConfigId, flowId);

        if (!flow) {
            throw Exceptions.NOT_FOUND_FLOW;
        }

        if (flow.status !== FlowStatusEnum.DRAFT) {
            throw Exceptions.ERROR_PUBLISHED_FLOW;
        }

        return await servicePartner.publishFlow(channelConfigId, flow.flowId);
    }

    async deactivateFlow(workspaceId: string, channelConfigId: string, flowId: number) {
        const flow = await this.getFlowByChannelAndWorkspaceAndId(workspaceId, channelConfigId, flowId);

        if (!flow) {
            throw Exceptions.NOT_FOUND_FLOW;
        }

        const result = await this.repository.update({ id: flow.id }, { active: false });

        if (result?.affected > 0) {
            const flowDataList = await this.flowDataService.getFlowDataByWorkspaceIdAndFlowId(workspaceId, flow.id);

            try {
                // Inativa todos os templates que possuem flowData vinculado
                for (const flowData of flowDataList?.data || []) {
                    await this.externalDataService.updateTemplateFlowInactivated(workspaceId, flowData.id);
                }
            } catch (e) {
                console.error('ERROR flowService.deactivateFlow updateTemplateFlowInactivated: ', e);
            }
            return { success: true, data: { ...flow, active: false, updatedAt: new Date() } };
        }

        return { success: false, data: null };
    }

    async activateFlow(workspaceId: string, channelConfigId: string, flowId: number) {
        const flow = await this.getFlowByChannelAndWorkspaceAndId(workspaceId, channelConfigId, flowId);

        if (!flow) {
            throw Exceptions.NOT_FOUND_FLOW;
        }

        const result = await this.repository.update({ id: flow.id }, { active: true });

        if (result?.affected > 0) {
            return { success: true, data: { ...flow, active: true, updatedAt: new Date() } };
        }

        return { success: false, data: null };
    }
}
