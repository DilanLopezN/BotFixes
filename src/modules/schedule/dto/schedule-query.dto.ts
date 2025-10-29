import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
// import { ExtractResumeType } from '../models/extract-resume.entity';
// import { ScheduleMessageState } from '../models/schedule-message.entity';

export enum StatusScheduleEnum {
    confirmed = 'confirmed',
    canceled = 'canceled',
    individual_cancel = 'individual_cancel',
    invalidNumber = 'invalid_number',
    not_answered = 'not_answered',
    reschedule = 'reschedule',
    open_cvs = 'open_cvs',
    no_recipient = 'no_recipient',
    invalid_recipient = 'invalid_recipient',
    confirm_reschedule = 'confirm_reschedule',
}

export enum feedbackEnum {
    withFeedback = 'withFeedback',
    noFeedback = 'noFeedback',
}

export enum RecepientTypeEnum {
    email = 'email',
    whatsapp = 'whatsapp',
}

export class ScheduleFilterListDto {
    @ApiProperty()
    @IsDateString()
    startDate: Date;

    @ApiProperty()
    @IsDateString()
    endDate: Date;

    @ApiProperty({ enum: StatusScheduleEnum, required: false })
    @IsOptional()
    @IsEnum(StatusScheduleEnum)
    status?: StatusScheduleEnum;

    @ApiProperty({ enum: StatusScheduleEnum, required: false })
    @IsOptional()
    @IsEnum(StatusScheduleEnum, { each: true })
    statusList?: StatusScheduleEnum[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ each: true })
    organizationUnitList?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ each: true })
    doctorCodeList?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ each: true })
    procedureCodeList?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ each: true })
    specialityCodeList?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ each: true })
    insuranceCodeList?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ each: true })
    insurancePlanCodeList?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ each: true })
    cancelReasonList?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ each: true })
    appointmentTypeCodeList?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    patientCode?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    aliasSettingId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    type?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    patientName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    scheduleCode?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ each: true })
    npsScoreList?: string[];

    @ApiProperty({ enum: feedbackEnum, required: false })
    @IsOptional()
    @IsEnum(feedbackEnum)
    feedback?: feedbackEnum;

    @ApiProperty({ enum: RecepientTypeEnum, required: false })
    @IsOptional()
    @IsEnum(RecepientTypeEnum)
    recipientType?: RecepientTypeEnum;

    workspaceId: string;
}

export class ScheduleResultDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    workspaceId: string;

    @ApiProperty()
    integrationId: string;

    @ApiProperty()
    procedureName: string;

    @ApiProperty()
    specialityName: string;

    @ApiProperty()
    doctorName: string;

    @ApiProperty()
    appointmentTypeName: string;

    @ApiProperty()
    scheduleCode: string;

    @ApiProperty()
    scheduleDate: Date;

    @ApiProperty()
    patientPhone: string;

    @ApiProperty()
    patientEmail: string;

    @ApiProperty()
    patientName: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    sendType: string;

    @ApiProperty()
    scheduleMessageUuid: string;

    @ApiProperty()
    conversationId: string;
}
