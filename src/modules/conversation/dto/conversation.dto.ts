import { ActivityDto } from './activities.dto';
import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IdentityType, ConversationBot, ConversationWorkspace } from '../interfaces/conversation.interface';

export class ViewedDto {
    @IsBoolean()
    @ApiProperty()
    viewed: boolean;
}

export class Identity {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name?: string;

    @ApiProperty()
    data?: any;

    @ApiProperty()
    avatar?: any;

    @ApiProperty()
    channelId: string;

    @ApiProperty()
    type: IdentityType;

    @ApiProperty()
    createdAt?: Date;

    @ApiProperty()
    removedAt?: Date;

    @ApiProperty()
    phone?: string;

    @ApiProperty()
    email?: string;

    @ApiProperty()
    disabled?: boolean;

    @ApiProperty()
    contactId?: string;

    @ApiProperty()
    track?: any;
}

export class ConversationAttribute {
    @ApiProperty()
    label?: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    value: string;
}

export class AttachmentFile {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    conversationId: string;

    @ApiProperty()
    memberId: string;

    @ApiProperty()
    attachmentLocation: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    mimeType: string;
}

export class ConversationTag {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    color: string;
}

export class ConversationDtoResponse {
    @ApiProperty()
    expiresAt: number;

    @ApiProperty()
    token: string;

    @ApiProperty()
    hash: string;

    @ApiProperty()
    organizationId: string;

    @ApiProperty({ isArray: true, type: Identity })
    members: Identity[];

    @ApiProperty()
    iid?: string;

    @ApiProperty({ isArray: true, type: ConversationTag })
    tags?: ConversationTag[];

    @ApiProperty()
    data?: any;

    @ApiProperty()
    state: string;

    @ApiProperty()
    read: boolean;

    @ApiProperty()
    test: boolean;

    @ApiProperty()
    requestIp?: string;

    @ApiProperty()
    refererUrl?: string;

    @ApiProperty()
    lastNotification?: string;

    @ApiProperty({ isArray: true, type: ActivityDto })
    activities?: any[];

    @ApiProperty({ isArray: false, type: 'ConversationBot' })
    bot?: ConversationBot;

    @ApiProperty({ isArray: false, type: 'ConversationWorkspace' })
    workspace?: ConversationWorkspace;

    @ApiProperty()
    rating?: number;

    @ApiProperty()
    fileAttachments?: any;

    @ApiProperty()
    createdByChannel?: string;

    @ApiProperty()
    seenBy?: { [userId: string]: string };

    @ApiProperty()
    pinnedBy?: { [userId: string]: string };

    @ApiProperty({ isArray: true, type: ConversationAttribute })
    attributes?: ConversationAttribute[];
}
