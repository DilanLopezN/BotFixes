import { IsString, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { typeDownloadEnum } from '../../../../common/utils/downloadFileType';

export class ConversationAppointmentFilterDto {
    @IsString()
    workspaceId: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    teamIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    agentIds?: string[];

    @IsOptional()
    @IsString()
    channelId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    state?: string[];

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsBoolean()
    includeAppointmentDetails?: boolean;
}

export interface ConversationAppointmentFilterDtoCSVParams extends ConversationAppointmentFilterDto {
    downloadType?: typeDownloadEnum;
}
