import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { Conversation, Identity } from './../../conversation/interfaces/conversation.interface';
import { Attachment } from '../interfaces/attchment.interface';
import { ConversationService } from './../../conversation/services/conversation.service';
import * as path from 'path';
import { v4 } from 'uuid';
import { FileUploaderService } from './../../../common/file-uploader/file-uploader.service';
import { CacheService } from './../../_core/cache/cache.service';
import * as moment from 'moment';
import { MongooseAbstractionService } from './../../../common/abstractions/mongooseAbstractionService.service';
import { AckType, ActivityType } from 'kissbot-core';
import { ActivityService } from './../../activity/services/activity.service';
import axios from 'axios';
import { TemplateMessageService } from '../../template-message/services/template-message.service';
import { TemplateMessage } from './../../template-message/interface/template-message.interface';
import { TagsService } from './../../tags/tags.service';
import { Tags } from './../../tags/interface/tags.interface';
import { TeamService } from '../../team/services/team.service';
import { Team, TeamPermissionTypes } from './../../team/interfaces/team.interface';
import { User } from './../../../modules/users/interfaces/user.interface';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../common/utils/roles';
import { Exceptions } from '../../auth/exceptions';
import * as Sentry from '@sentry/node';
import { UploadingFile } from '../../../common/interfaces/uploading-file.interface';
import { castObjectId, castObjectIdToString } from '../../../common/utils/utils';

@Injectable()
export class AttachmentService extends MongooseAbstractionService<Attachment> {
    private readonly logger = new Logger(AttachmentService.name);
    constructor(
        @InjectModel('Attachment') protected readonly model: Model<Attachment>,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
        @Inject(forwardRef(() => TemplateMessageService))
        private readonly templateMessageService: TemplateMessageService,
        private readonly tagsService: TagsService,
        private readonly teamService: TeamService,
        private readonly fileUploaderService: FileUploaderService,
        public cacheService: CacheService,
        private readonly activityService: ActivityService,
    ) {
        super(model);
    }

    getSearchFilter(search: string): any {}

    getEventsData() {}

    async getAttachmentsByConversationId(conversationId: string) {
        try {
            return await this.model.find({
                conversationId,
            });
        } catch (e) {
            console.log('AttachmentService.getAttachmentsByConversationId', e);
        }
    }

    async createAndUpload(
        file: UploadingFile,
        conversationId: string,
        memberId: string | string[],
        isStartActivity?: boolean,
        text?: string,
        templateId?: string,
        user?: User,
        hash?: string,
        type?: string,
    ) {
        const conversation: Conversation = await this.conversationService.findOne({ _id: conversationId });
        if (!conversation) {
            throw new BadRequestException('conversation does not exists');
        }
        let memberUploader;
        try {
            if (Array.isArray(memberId)) {
                memberUploader = conversation.members.find((member) => memberId.includes(member.id));
            } else {
                memberUploader = conversation.members.find((member) => member.id == memberId);
            }
        } catch (e) {
            Sentry.captureEvent({
                message: 'AttachmentService.createAndUpload',
                extra: {
                    error: e,
                },
            });
            memberUploader = conversation.members.find((member) => member.id == memberId);
        }
        if (memberUploader?.disabled) {
            throw Exceptions.DISABLED_MEMBER_CANNOT_SEND_MESSAGE;
        }

        let s3Key = await this.getAttachmentKey(conversation, file.originalname);

        await this.fileUploaderService.upload({
            ...file,
            // Para botar o arquivo dentro da pasta do token no S3
            originalname: s3Key,
        });

        let textFile: string | undefined = text;
        if (user) {
            const workspaceAdmin = isWorkspaceAdmin(user, conversation.workspace._id);
            const isAnyAdmin = isAnySystemAdmin(user);

            let canSendOfficialTemplate = workspaceAdmin || isAnyAdmin;
            let template: TemplateMessage | undefined = undefined;

            if (templateId) {
                template = await this.templateMessageService.findOne({
                    workspaceId: conversation.workspace._id,
                    _id: templateId,
                });

                if (template.isHsm && !canSendOfficialTemplate) {
                    const teamByUserPermission: Team[] = await this.teamService.getUserTeamPermissions(
                        conversation.workspace._id,
                        castObjectIdToString(user._id),
                        TeamPermissionTypes.canSendOfficialTemplate,
                        conversation.assignedToTeamId,
                    );

                    if (teamByUserPermission) {
                        canSendOfficialTemplate = true;
                    }
                }

                if (template && template.tags.length && canSendOfficialTemplate) {
                    const tags: Tags[] = await this.tagsService.getAll({
                        workspaceId: template.workspaceId,
                        _id: { $in: template.tags },
                        inactive: false,
                    });

                    if (tags) {
                        await this.conversationService.addTags(castObjectIdToString(conversation._id), tags);
                    }
                }
            }
            textFile = template ? (canSendOfficialTemplate ? text : undefined) : text;
        }

        const created = await this._create(
            conversation,
            memberUploader,
            file.originalname,
            file.mimetype,
            null,
            null,
            s3Key,
            hash || null,
            isStartActivity,
            file.buffer.byteLength,
            textFile,
            undefined,
            undefined,
            undefined,
            type,
        );

        this.cacheService.setObject(file.buffer.toString('hex'), created._id + ':content', 30);

        return {
            ...(created.toJSON ? created.toJSON({ minimize: false }) : created),
            id: created._id,
        } as Attachment;
    }

    async getAttachmentKey(conversation: Conversation, originalname?: string) {
        const extension = path.extname(originalname || '');

        let s3Key = null;

        if (extension) {
            s3Key = `${conversation.token}/${conversation.iid || conversation._id}/${v4()}${extension}`;
        } else {
            s3Key = `${conversation.token}/${conversation.iid || conversation._id}/${v4()}_${originalname}`;
        }
        return s3Key;
    }

    public async _create(
        conversation: Conversation,
        memberUploader: Identity,
        fileOriginalName: string,
        mimeType: string,
        quoted?: string,
        attachmentLocation?: string,
        key?: string,
        activityHash?: string,
        isStartActivity?: boolean,
        size?: number,
        text?: string,
        isHsm?: boolean,
        data?: any,
        activityAttachments?: any,
        type?: string,
    ) {
        const attachment = new this.model({
            conversationId: castObjectId(conversation._id),
            memberId: memberUploader.id,
            name: fileOriginalName,
            mimeType,
            key,
            timestamp: moment().valueOf(),
            size,
        });

        if (!attachmentLocation) {
            const fileViewUrl = `${process.env.API_URI}/conversations/${conversation._id}/attachments/${attachment._id}/view`;
            attachment.attachmentLocation = fileViewUrl;
        } else {
            attachment.attachmentLocation = attachmentLocation;
        }

        const createdAttachment = await this.create(attachment);

        if (!isStartActivity) {
            const activity = {
                from: memberUploader,
                type: type && type === 'comment' ? ActivityType.comment : ActivityType.member_upload_attachment,
                ack: type && type === 'comment' ? AckType.DeliveryAck : AckType.Pending,
                attachmentFile: {
                    contentType: mimeType,
                    contentUrl: attachment.attachmentLocation,
                    name: fileOriginalName,
                    key: attachment.key,
                    id: createdAttachment._id,
                },
                attachments: activityAttachments || null,
                hash: activityHash,
                text,
                isHsm,
                data,
            } as any;

            if (quoted) {
                activity.quoted = quoted;
            }

            try {
                if (!activity?.text && !activity?.attachmentFile) {
                    Sentry.captureEvent({
                        message: 'DEBUG AttachmentService: empty message',
                        extra: {
                            activity,
                        },
                    });
                }
            } catch (e) {
                Sentry.captureEvent({
                    message: 'DEBUG AttachmentService: empty message catch',
                    extra: {
                        e,
                    },
                });
            }

            const useActivityHash = activity?.hash && !isObjectIdOrHexString(activity.hash) ? true : false;
            this.activityService.handleActivity(
                activity,
                castObjectIdToString(conversation._id),
                conversation,
                useActivityHash,
            );
        }
        return createdAttachment;
    }

    async headRequestView(attachmentId: string) {
        const attachment = await this.model.findOne({ _id: attachmentId });
        if (attachment) {
            if (attachment.size) {
                return {
                    'Content-Type': attachment.mimeType,
                    'Content-Length': attachment.size,
                };
            }
            const url = await this.fileUploaderService.getAuthUrl(attachment.key);
            const response = await axios.get(url);
            return response.headers;
        }
        return null;
    }

    async view(attachmentId: string, download: boolean = false) {
        const attachment = await this.model.findOne({ _id: attachmentId });
        let stream = null;
        let url = null;
        if (attachment) {
            url = await this.fileUploaderService.getAuthUrl(attachment.key);
        }
        return { url, attachment, stream };
    }
}
