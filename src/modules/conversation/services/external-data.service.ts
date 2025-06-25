import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ContactsAcceptedPrivacyPolicyService } from '../../privacy-policy/services/contacts-accepted-privacy-policy.service';
import { PrivacyPolicyService } from '../../privacy-policy/services/privacy-policy.service';
import { AudioTranscriptionService } from '../../context-ai/audio-transcription/services/audio-transcription.service';
import { BlockedContactService } from '../../contact/services/blocked-contact.service';
import { ConversationCategorizationService } from '../../conversation-categorization-v2/services/conversation-categorization.service';
import { ConversationCategorization } from '../../conversation-categorization-v2/models/conversation-categorization.entity';
import { CreateConversationCategorizationParams } from '../../conversation-categorization-v2/interfaces/create-conversation-categorization.interface';
import { DefaultResponse } from '../../../common/interfaces/default';
import { SmtReService } from '../../conversation-smt-re/services/smt-re.service';
import { SmtRe } from '../../conversation-smt-re/models/smt-re.entity';

@Injectable()
export class ExternalDataService {
    private contactsAcceptedPrivacyPolicyService: ContactsAcceptedPrivacyPolicyService;
    private privacyPolicyService: PrivacyPolicyService;
    private audioTranscriptionService: AudioTranscriptionService;
    private blockedContactService: BlockedContactService;
    private conversationCategorizationService: ConversationCategorizationService;
    private smtReService: SmtReService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.contactsAcceptedPrivacyPolicyService = this.moduleRef.get<ContactsAcceptedPrivacyPolicyService>(
            ContactsAcceptedPrivacyPolicyService,
            { strict: false },
        );
        this.privacyPolicyService = this.moduleRef.get<PrivacyPolicyService>(PrivacyPolicyService, { strict: false });
        this.audioTranscriptionService = this.moduleRef.get<AudioTranscriptionService>(AudioTranscriptionService, {
            strict: false,
        });
        this.blockedContactService = this.moduleRef.get<BlockedContactService>(BlockedContactService, {
            strict: false,
        });
        this.conversationCategorizationService = this.moduleRef.get<ConversationCategorizationService>(
            ConversationCategorizationService,
            { strict: false },
        );
        this.smtReService = this.moduleRef.get<SmtReService>(SmtReService, { strict: false });
    }

    async setAcceptedPrivacyPolicy(
        workspaceId: string,
        data: { phone: string; channelConfigId: string },
    ): Promise<void> {
        return await this.contactsAcceptedPrivacyPolicyService.setContactAcceptedByPhoneCacheKey(
            workspaceId,
            data.channelConfigId,
            data.phone,
        );
    }

    async getAcceptedPrivacyPolicyByPhoneFromCache(
        workspaceId: string,
        data: { phone: string; channelConfigToken: string },
    ): Promise<{ acceptanceAt: string }> {
        return await this.contactsAcceptedPrivacyPolicyService.getContactAcceptedByPhoneFromCache(
            workspaceId,
            data.channelConfigToken,
            data.phone,
        );
    }

    async getPrivacyPolicyByChannelConfigToken(workspaceId: string, channelConfigId: string) {
        return await this.privacyPolicyService.getPrivacyPolicyByChannelConfigId(workspaceId, channelConfigId);
    }

    async getAudioTranscriptionsByConversationId(workspaceId: string, conversationId: string) {
        return await this.audioTranscriptionService.getAudioTranscriptionsByConversationId(
            String(conversationId),
            workspaceId,
        );
    }

    async getBlockedContactByWhatsapp(workspaceId: string, phone: string) {
        return await this.blockedContactService.getBlockedContactByWhatsapp(workspaceId, phone);
    }

    async createConversationCategorization(
        workspaceId: string,
        createConversationCategorizationParams: CreateConversationCategorizationParams,
    ): Promise<DefaultResponse<ConversationCategorization>> {
        return await this.conversationCategorizationService.createConversationCategorization(
            workspaceId,
            createConversationCategorizationParams,
        );
    }

    async createSmtRe(
        conversationId: string,
        workspaceId: string,
        smtReSettingId: string,
        teamId?: string,
    ): Promise<SmtRe> {
        return await this.smtReService.create(conversationId, workspaceId, smtReSettingId, teamId);
    }

    async findSmtReById(id: string): Promise<SmtRe> {
        return await this.smtReService.findById(id);
    }

    async stopSmtRe(conversationId: string, memberId: string): Promise<void> {
        return await this.smtReService.stopSmtRe(conversationId, memberId);
    }
}
