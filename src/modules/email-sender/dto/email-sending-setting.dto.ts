import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { EmailSendingSetting } from '../models/email-sending-setting.entity';
import { EmailType } from '../interfaces/email.interface';

export class EmailSendingSettingDto implements Omit<EmailSendingSetting, 'id' | 'createdAt' | 'deletedAt'> {
    @IsBoolean()
    enabled: boolean;

    @IsString()
    settingName: string;

    @IsString()
    workspaceId: string;

    @IsString()
    templateId: string;

    @IsString()
    versionId: string;

    @IsEnum(EmailType)
    emailType: EmailType;

    @IsObject()
    @IsOptional()
    templateVariables?: Record<string, string>;
}

export class CreateEmailSendingSettingDto
    implements Omit<EmailSendingSetting, 'id' | 'createdAt' | 'workspaceId' | 'deletedAt'>
{
    @IsBoolean()
    enabled: boolean;

    @IsString()
    settingName: string;

    @IsString()
    templateId: string;

    @IsString()
    versionId: string;

    @IsEnum(EmailType)
    emailType: EmailType;

    @IsObject()
    @IsOptional()
    templateVariables?: Record<string, string>;
}

export class UpdateEmailSendingSettingDto
    implements Omit<EmailSendingSetting, 'id' | 'createdAt' | 'workspaceId' | 'deletedAt'>
{
    @IsBoolean()
    enabled: boolean;

    @IsString()
    settingName: string;

    @IsString()
    templateId: string;

    @IsString()
    versionId: string;

    @IsEnum(EmailType)
    emailType: EmailType;

    @IsObject()
    @IsOptional()
    templateVariables?: Record<string, string>;
}
