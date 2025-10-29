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
import { FileUploaderService } from '../../../common/file-uploader/file-uploader.service';
import { FileToUpload } from '../../../common/file-uploader/interfaces/file-to-upload.interface';
import * as Sentry from '@sentry/node';

@Injectable()
export class ExternalDataService {
    private _contactsAcceptedPrivacyPolicyService: ContactsAcceptedPrivacyPolicyService;
    private _privacyPolicyService: PrivacyPolicyService;
    private _audioTranscriptionService: AudioTranscriptionService;
    private _blockedContactService: BlockedContactService;
    private _conversationCategorizationService: ConversationCategorizationService;
    private _smtReService: SmtReService;
    private _fileUploaderService: FileUploaderService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get contactsAcceptedPrivacyPolicyService(): ContactsAcceptedPrivacyPolicyService {
        if (!this._contactsAcceptedPrivacyPolicyService) {
            this._contactsAcceptedPrivacyPolicyService = this.moduleRef.get<ContactsAcceptedPrivacyPolicyService>(
                ContactsAcceptedPrivacyPolicyService,
                { strict: false },
            );
        }
        return this._contactsAcceptedPrivacyPolicyService;
    }

    private get privacyPolicyService(): PrivacyPolicyService {
        if (!this._privacyPolicyService) {
            this._privacyPolicyService = this.moduleRef.get<PrivacyPolicyService>(PrivacyPolicyService, {
                strict: false,
            });
        }
        return this._privacyPolicyService;
    }

    private get audioTranscriptionService(): AudioTranscriptionService {
        if (!this._audioTranscriptionService) {
            this._audioTranscriptionService = this.moduleRef.get<AudioTranscriptionService>(AudioTranscriptionService, {
                strict: false,
            });
        }
        return this._audioTranscriptionService;
    }

    private get blockedContactService(): BlockedContactService {
        if (!this._blockedContactService) {
            this._blockedContactService = this.moduleRef.get<BlockedContactService>(BlockedContactService, {
                strict: false,
            });
        }
        return this._blockedContactService;
    }

    private get conversationCategorizationService(): ConversationCategorizationService {
        if (!this._conversationCategorizationService) {
            this._conversationCategorizationService = this.moduleRef.get<ConversationCategorizationService>(
                ConversationCategorizationService,
                { strict: false },
            );
        }
        return this._conversationCategorizationService;
    }

    private get smtReService(): SmtReService {
        if (!this._smtReService) {
            this._smtReService = this.moduleRef.get<SmtReService>(SmtReService, { strict: false });
        }
        return this._smtReService;
    }

    private get fileUploaderService(): FileUploaderService {
        if (!this._fileUploaderService) {
            this._fileUploaderService = this.moduleRef.get<FileUploaderService>(FileUploaderService, {
                strict: false,
            });
        }
        return this._fileUploaderService;
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
        try {
            return await this.blockedContactService.getBlockedContactByWhatsapp(workspaceId, phone);
        } catch (e) {
            Sentry.captureEvent({
                message: 'Conversation.ExternalDataService.getBlockedContactByWhatsapp',
                extra: {
                    error: e,
                    workspaceId,
                    phone,
                },
            });
        }
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

    async findLastByConversationId(conversationId: string): Promise<SmtRe> {
        return await this.smtReService.findLastByConversationId(conversationId);
    }

    async stopSmtRe(conversationId: string, memberId: string): Promise<SmtRe> {
        return await this.smtReService.stopSmtRe(conversationId, memberId);
    }

    async uploadToS3Service(uploadData: FileToUpload) {
        return await this.fileUploaderService.upload(uploadData);
    }
}
