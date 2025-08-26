import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, Validate } from 'class-validator';
import { WorkingTimeFilter, WorkingTimeType } from '../interfaces/working-time.interface';

export class WorkingTimeFilterDto implements WorkingTimeFilter {
    @IsString()
    workspaceId: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Validate(
        ({ value }) => {
            const date = new Date(value);
            return !isNaN(date.getTime());
        },
        {
            message: 'startDate must be a valid timestamp',
        },
    )
    startDate?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Validate(
        ({ value }) => {
            const date = new Date(value);
            return !isNaN(date.getTime());
        },
        {
            message: 'endDate must be a valid timestamp',
        },
    )
    endDate?: number;

    @IsOptional()
    @IsEnum(WorkingTimeType)
    type?: WorkingTimeType;

    @IsOptional()
    @IsNumber()
    breakSettingId?: number;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
