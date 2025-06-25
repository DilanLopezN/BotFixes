import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ActiveMessageSettingService } from '../../active-message/services/active-message-setting.service';
import { ActiveMessageSetting, ObjectiveType } from '../../active-message/models/active-message-setting.entity';
import { ActiveMessageService } from '../../active-message/services/active-message.service';
import { IWhatswebCheckPhoneNumberResponseEvent } from 'kissbot-core';
import { SendMessageService } from '../../active-message/services/send-message.service';
import { SendActiveMessageData } from '../../active-message/interfaces/send-active-message-data.interface';
import { TemplateMessageService } from '../../template-message/services/template-message.service';
import { TemplateMessage } from '../../template-message/interface/template-message.interface';
import { Contact } from '../../campaign/models/contact.entity';
import { InteractionsService } from '../../interactions/services/interactions.service';
import { ActiveMessageStatusService } from '../../active-message/services/active-message-status.service';

@Injectable()
export class ExternalDataService {
    private activeMessageSettingService: ActiveMessageSettingService;
    private activeMessageService: ActiveMessageService;
    private sendMessageService: SendMessageService;
    private templateMessageService: TemplateMessageService;
    private interactionsService: InteractionsService;
    private activeMessageStatusService: ActiveMessageStatusService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.activeMessageSettingService = this.moduleRef.get<ActiveMessageSettingService>(
            ActiveMessageSettingService,
            { strict: false },
        );
        this.activeMessageService = this.moduleRef.get<ActiveMessageService>(ActiveMessageService, { strict: false });
        this.activeMessageStatusService = this.moduleRef.get<ActiveMessageStatusService>(ActiveMessageStatusService, { strict: false });
        this.sendMessageService = this.moduleRef.get<SendMessageService>(SendMessageService, { strict: false });
        this.templateMessageService = this.moduleRef.get<TemplateMessageService>(TemplateMessageService, { strict: false });
        this.interactionsService = this.moduleRef.get<InteractionsService>(InteractionsService, { strict: false });
    }

    async listEnabledByWorkspaceId(workspaceId: string, objective?: ObjectiveType) {
        return await this.activeMessageSettingService.listEnabledByWorkspaceId(workspaceId, objective);
    }

    async getConversationIdByExternalIdList(externalIdList: string[], workspaceId: string) {
        return await this.activeMessageService.getConversationIdByExternalIdList(externalIdList, workspaceId);
    }

    async getOneActiveMessageSetting(activeMessageSettingId: number): Promise<ActiveMessageSetting> {
        return await this.activeMessageSettingService.getOne(activeMessageSettingId);
    }

    async sendMessageFromValidateNumber(event: IWhatswebCheckPhoneNumberResponseEvent, data: SendActiveMessageData) {
        await this.sendMessageService.sendMessageFromValidateNumber(event, data);
    }

    async sendMessage(data: SendActiveMessageData) {
        await this.sendMessageService.sendMessage(data);
    }

    async getOneTemplateMessage(templateMessageId: string): Promise<TemplateMessage> {
        return await this.templateMessageService.getOne(templateMessageId);
    }

    async addConversationIdsInContacts(contacts: Contact[]): Promise<Contact[]> {
        const externalIdList = contacts.map((contact) => contact.campaignContact?.hash);
        if (externalIdList.length === 0) {
            return contacts;
        }
        const activeMessages = await this.activeMessageService.getConversationIdByExternalIdList(externalIdList);
        const statusIdList = [
            ...new Set(activeMessages.filter((actMsg) => !!actMsg.statusId).map((curr) => curr.statusId) || []),
        ];
        const statusCodes = await this.activeMessageStatusService.getStatusCodeByIdList(statusIdList);
        const statusResume = {
            '-1': 'Número inválido',
            '-2': 'Número possui conversa aberta',
        };
        contacts.forEach((contact) => {
            const conversation = activeMessages.find((data) => data.externalId === contact.campaignContact?.hash);
            if (conversation) {
                contact['conversationId'] = conversation.conversationId;
            }
            const descriptionCode = statusCodes?.find((currStatus) => {
                const statusId = activeMessages.find(
                    (data) => data.externalId === contact.campaignContact?.hash,
                )?.statusId;

                if (!statusId) return false;

                return currStatus?.id === Number(statusId);
            })?.statusCode;

            if (descriptionCode && statusResume?.[`${descriptionCode}`]) {
                contact['descriptionError'] = statusResume[`${descriptionCode}`];
            }
        });

        return contacts;
    }

    async checkInteractionIsPublishedByTrigger(workspaceId: string, trigger: string): Promise<boolean> {
        return await this.interactionsService.checkInteractionIsPublishedByTrigger(workspaceId, trigger);
    }

    async getTemplateVariableKeys(templateId: string) {
        return await this.templateMessageService.getTemplateVariableKeys(templateId);
    }
}
