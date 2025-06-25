import { Identity } from './conversation.dto';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityType } from 'kissbot-core';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConversationAccount {
    isGroup?: boolean;
}

export class Attachment {
    @ApiProperty()
    contentType?: string;

    @ApiProperty()
    contentUrl?: string;

    @ApiProperty()
    content?: any;

    @ApiProperty()
    name?: string;

    @ApiProperty()
    thumbnailUrl?: string;
}

export class AttachmentFile {
    @ApiProperty()
    id?: string;

    @ApiProperty()
    contentType?: string;

    @ApiProperty()
    contentUrl?: string;

    @ApiProperty()
    name?: string;

    @ApiProperty()
    key?: string;
}

export class ActivityDto {
    @ApiProperty({ enum: ActivityType })
    @IsEnum(ActivityType)
    type?: ActivityType;

    @ApiProperty()
    @MaxLength(4096)
    text?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    templateId?: string;

    @ApiProperty()
    @IsOptional()
    @IsArray()
    templateVariableValues?: string[];

    @ApiProperty()
    attachmentLayout?: string;

    @ApiProperty({ isArray: true, type: Attachment })
    attachments?: Attachment[];

    @ApiProperty({ isArray: true, type: AttachmentFile })
    attachmentFile?: AttachmentFile;

    @ApiProperty()
    name?: string;

    @ApiProperty()
    conversationId?: string;

    @ApiProperty()
    timestamp?: number;

    @ApiProperty()
    channelId?: string;

    @ApiProperty({ type: Identity, isArray: false })
    from?: Identity;

    @ApiProperty({ type: Identity, isArray: false })
    to?: Identity;

    @ApiProperty()
    conversation?: ConversationAccount;

    @ApiProperty()
    sended?: boolean;

    @ApiProperty()
    isTest?: boolean;

    @ApiProperty()
    language?: string;

    @ApiProperty()
    id?: any;

    @ApiProperty()
    data?: any;

    @ApiProperty()
    hash?: any;

    @ApiProperty()
    quoted?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    referralSourceId?: string;
}
