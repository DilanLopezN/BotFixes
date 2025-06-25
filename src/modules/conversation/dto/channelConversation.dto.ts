import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ChannelIdConfig } from 'kissbot-core';

class StartMember {
    @ApiProperty({ type: String })
    @IsString()
    id: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsOptional()
    ddi?: string;

    @ApiProperty({ type: String })
    @IsString()
    name: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsOptional()
    email?: string;
}

export class ChannelConversationStart {
    @ApiProperty({ type: String, enum: ChannelIdConfig })
    @IsString()
    channelConfigId: string;

    @ApiProperty({ type: StartMember })
    startMember: StartMember;

    @ApiProperty({ type: String })
    contactId?: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    assignedToTeamId: string;
}

export class ChannelCallbackConversationStartAttribute {
    @ApiProperty({ type: String, required: true })
    value: any;

    @ApiProperty({ type: String, required: true })
    type: string;

    @ApiProperty({ type: String, required: false })
    label: string;

    @ApiProperty({ type: String, required: true })
    name: string;
}

export class ChannelCallbackConversationStart {
    @ApiProperty({ type: String, required: true })
    @IsString()
    assignedToTeamId: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    phoneNumber: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    ddi?: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    action?: string;

    @ApiProperty({ type: Number, required: true })
    @IsString()
    priority?: number;

    @ApiProperty({ type: String, required: true })
    @IsString()
    text?: string;

    @ApiProperty({ type: String })
    @IsString()
    templateId?: string;

    @ApiProperty({ type: [ChannelCallbackConversationStartAttribute], required: false })
    @IsString()
    attributes?: ChannelCallbackConversationStartAttribute[];
}
