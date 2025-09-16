import { ScheduleGroupRule } from '../interfaces/schedule-group-rule.enum';
import { RecipientType } from '../models/schedule-message.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConfirmationSettingDto {
  @ApiProperty({ description: 'API token for authentication' })
  @IsString()
  @IsNotEmpty()
  apiToken: string;

  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ description: 'Schedule setting ID', required: false })
  @IsOptional()
  @IsNumber()
  scheduleSettingId?: number;

  @ApiProperty({ description: 'Template ID for messages' })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({ description: 'Whether to retry invalid numbers', required: false })
  @IsOptional()
  @IsBoolean()
  retryInvalid?: boolean;

  @ApiProperty({ description: 'Whether to resend when no match', required: false })
  @IsOptional()
  @IsBoolean()
  resendMsgNoMatch?: boolean;

  @ApiProperty({ description: 'Whether the setting is active' })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ description: 'ERP parameters', required: false })
  @IsOptional()
  @IsString()
  erpParams?: string;

  @ApiProperty({ description: 'Schedule group rule', enum: ScheduleGroupRule, required: false })
  @IsOptional()
  @IsEnum(ScheduleGroupRule)
  groupRule?: ScheduleGroupRule;

  @ApiProperty({ description: 'Recipient type', enum: RecipientType, required: false })
  @IsOptional()
  @IsEnum(RecipientType)
  sendRecipientType?: RecipientType;

  @ApiProperty({ description: 'Email sending setting ID', required: false })
  @IsOptional()
  @IsNumber()
  emailSendingSettingId?: number;

  @ApiProperty({ description: 'Sending group type', required: false })
  @IsOptional()
  @IsString()
  sendingGroupType?: string;
}

export class UpdateConfirmationSettingDto {
  @ApiProperty({ description: 'Confirmation setting ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ description: 'API token for authentication' })
  @IsString()
  @IsNotEmpty()
  apiToken: string;

  @ApiProperty({ description: 'Template ID for messages' })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({ description: 'Whether the setting is active' })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ description: 'Whether to retry invalid numbers', required: false })
  @IsOptional()
  @IsBoolean()
  retryInvalid?: boolean;

  @ApiProperty({ description: 'Whether to resend when no match', required: false })
  @IsOptional()
  @IsBoolean()
  resendMsgNoMatch?: boolean;

  @ApiProperty({ description: 'ERP parameters', required: false })
  @IsOptional()
  @IsString()
  erpParams?: string;

  @ApiProperty({ description: 'Schedule group rule', enum: ScheduleGroupRule, required: false })
  @IsOptional()
  @IsEnum(ScheduleGroupRule)
  groupRule?: ScheduleGroupRule;

  @ApiProperty({ description: 'Recipient type', enum: RecipientType, required: false })
  @IsOptional()
  @IsEnum(RecipientType)
  sendRecipientType?: RecipientType;

  @ApiProperty({ description: 'Email sending setting ID', required: false })
  @IsOptional()
  @IsNumber()
  emailSendingSettingId?: number;

  @ApiProperty({ description: 'Sending group type', required: false })
  @IsOptional()
  @IsString()
  sendingGroupType?: string;
}

export class ListConfirmationSettingDto {
  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}