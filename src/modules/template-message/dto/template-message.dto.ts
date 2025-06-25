import { IsString, IsBoolean, MaxLength, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TemplateButtonType, TemplateStatus } from '../schema/template-message.schema';
import { TemplateCategory, TemplateLanguage } from '../../channels/gupshup/services/partner-api.service';

export class TemplateMessageChannel {
    @ApiProperty()
    @IsString()
    channelConfigId: string;

    @ApiProperty()
    @IsString()
    appName: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    wabaTemplateId?: string;

    @ApiProperty()
    @IsString()
    elementName: string;

    @ApiProperty()
    @IsOptional()
    status: TemplateStatus;

    @ApiProperty()
    @IsOptional()
    @IsString()
    rejectedReason?: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    category?: TemplateCategory;
}

type WabaResultType = {
    [channelId: string]: TemplateMessageChannel;
};

export class TemplateVariable {
    @ApiProperty()
    @IsString()
    value: string;

    @ApiProperty()
    @IsString()
    label: string;

    @ApiProperty()
    @IsString()
    type: string;

    @ApiProperty()
    @IsBoolean()
    required: boolean;

    @ApiProperty()
    @IsString()
    @IsOptional()
    sampleValue?: string;
}

export class TemplateButton {
    @ApiProperty()
    @IsString()
    type: TemplateButtonType;

    @ApiProperty()
    @IsString()
    text: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    url?: string;

    @ApiProperty()
    @IsString({ each: true })
    @IsOptional()
    example?: string[];

    @IsNumber()
    @ApiProperty()
    flowDataId?: number;

    @IsString()
    @ApiProperty()
    flowName?: string;
}

export class TemplateMessageDto {
    @IsString()
    @MaxLength(4096)
    @ApiProperty()
    message: string;

    @IsString()
    @ApiProperty()
    name: string;

    @IsBoolean()
    @ApiProperty()
    isHsm: boolean;

    @IsBoolean()
    @ApiProperty()
    active?: boolean;

    @IsString()
    @ApiProperty()
    userId?: string;

    @IsString()
    @ApiProperty()
    workspaceId?: string;

    @ApiProperty()
    tags?: string[];

    @ApiProperty()
    @IsOptional()
    teams?: string[];

    @ApiProperty()
    @IsOptional()
    channels?: string[];

    @ApiProperty()
    @IsOptional()
    channelsBackup?: string[];

    @ApiProperty()
    @IsOptional()
    variables?: TemplateVariable[];

    @ApiProperty()
    @IsOptional()
    wabaResult?: WabaResultType;

    @ApiProperty()
    @IsOptional()
    @IsString()
    whatsappTemplateId?: string;

    @ApiProperty()
    @IsOptional()
    status?: TemplateStatus;

    @ApiProperty()
    @IsOptional()
    @IsString()
    rejectedReason?: string;

    @ApiProperty()
    @IsOptional()
    languageCode?: TemplateLanguage;

    @ApiProperty()
    @IsOptional()
    category?: TemplateCategory;

    @ApiProperty()
    @IsOptional()
    buttons?: TemplateButton[];

    @ApiProperty()
    @IsOptional()
    @IsString()
    action?: string;
}
