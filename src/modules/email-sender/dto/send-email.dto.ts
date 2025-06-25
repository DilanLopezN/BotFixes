import { IsObject, IsOptional, IsString } from 'class-validator';
import { Email, EmailType } from '../interfaces/email.interface';

export class SendEmailDto implements Omit<Email, 'id' | 'createdAt'> {
    @IsString()
    fromEmail: string;

    @IsString()
    fromTitle: string;

    @IsString()
    to: string;

    @IsString()
    subject: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    templateId?: string;

    @IsObject()
    @IsOptional()
    templateData?: object;

    @IsString()
    @IsOptional()
    unsubscribeGroupId?: string;

    @IsString()
    @IsOptional()
    externalId?: string;

    @IsString()
    @IsOptional()
    text?: string;

    @IsString()
    @IsOptional()
    html?: string;

    @IsString()
    @IsOptional()
    type?: EmailType;
}
