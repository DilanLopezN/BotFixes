import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { IWhatswebCheckPhoneNumberResponseEvent } from "kissbot-core";
import { SendActiveMessageData } from "../../active-message/interfaces/send-active-message-data.interface";
import { ActiveMessageSettingService } from "../../active-message/services/active-message-setting.service";
import { SendMessageService } from "../../active-message/services/send-message.service";
import { InteractionsService } from "../../interactions/services/interactions.service";
import { ObjectiveType } from "../../active-message/models/active-message-setting.entity";

@Injectable()
export class ExternalDataService {
    private _sendMessageService: SendMessageService;
    private _activeMessageSettingService: ActiveMessageSettingService;
    private _interactionsService: InteractionsService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get sendMessageService(): SendMessageService {
        if (!this._sendMessageService) {
            this._sendMessageService = this.moduleRef.get<SendMessageService>(SendMessageService, { strict: false });
        }
        return this._sendMessageService;
    }

    private get activeMessageSettingService(): ActiveMessageSettingService {
        if (!this._activeMessageSettingService) {
            this._activeMessageSettingService = this.moduleRef.get<ActiveMessageSettingService>(ActiveMessageSettingService, { strict: false });
        }
        return this._activeMessageSettingService;
    }

    private get interactionsService(): InteractionsService {
        if (!this._interactionsService) {
            this._interactionsService = this.moduleRef.get<InteractionsService>(InteractionsService, { strict: false });
        }
        return this._interactionsService;
    }

    async sendMessageFromValidateNumber(event: IWhatswebCheckPhoneNumberResponseEvent, data: SendActiveMessageData) {
        return await this.sendMessageService.sendMessageFromValidateNumber(
            event,
            data,
        );
    }

    async sendMessage(data: SendActiveMessageData) {
        return await this.sendMessageService.sendMessage(data);
    }

    async listEnabledByWorkspaceId(workspaceId: string, objective?: ObjectiveType) {
        return await this.activeMessageSettingService.listEnabledByWorkspaceId(workspaceId, objective);
    }

    async getOneActiveMessageSetting(activeMessageSettingId: number) {
        return await this.activeMessageSettingService.getOne(activeMessageSettingId);
    }

    async existsInteractionByTrigger(workspaceId: string, trigger: string) {
        return await this.interactionsService.existsInteractionByTriggers(workspaceId, trigger);
    }

    async checkInteractionIsPublishedByTrigger(workspaceId: string, trigger: string): Promise<boolean> {
        return await this.interactionsService.checkInteractionIsPublishedByTrigger(workspaceId, trigger);
    }
}
