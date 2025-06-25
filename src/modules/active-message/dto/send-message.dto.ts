import {
    CreateActiveMessageAttributeData,
    SendActiveMessageData,
} from '../interfaces/send-active-message-data.interface';
import { IsArray, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateActiveMessageAttributeDto implements CreateActiveMessageAttributeData {
    value: any;
    type: string;
    label: string;
    name: string;
}
export class SendActiveMessageDto implements SendActiveMessageData {
    workspaceId: string;
    apiToken: string;
    teamId: string;
    phoneNumber: string;
    action?: string;
    priority?: number;
    text?: string;
    templateId?: string;
    attributes?: CreateActiveMessageAttributeData[];
}

export class CreateActiveMessageAttributeClassDto {
    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    value: string;

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    type: string;

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    label: string;

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    name: string;
}

export class SendActiveMessageClassDto {
    @ApiProperty({ type: String, required: true })
    @IsString()
    apiToken: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @MaxLength(20)
    @Matches(/^[0-9]+$/, { message: 'Invalid phone number, send numbers only' })
    phoneNumber: string;

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    externalId?: string;

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    action?: string;

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    templateId?: string;

    @ApiProperty({
        type: CreateActiveMessageAttributeClassDto,
        isArray: true,
        required: false,
    })
    @IsArray()
    @IsOptional()
    @Type(() => CreateActiveMessageAttributeClassDto)
    attributes?: CreateActiveMessageAttributeClassDto[];
}
