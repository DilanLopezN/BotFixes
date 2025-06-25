import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { FlowAction, FlowPeriodOfDay, FlowTriggerType, FlowType, HealthFlowSteps } from 'kissbot-core';

export class CreateHealthFlowDto {
    @IsString({ each: true })
    @IsOptional()
    organizationUnitId?: string[];

    @IsString({ each: true })
    @IsOptional()
    insuranceId?: string[];

    @IsString({ each: true })
    @IsOptional()
    typeOfServiceId?: string[];

    @IsString({ each: true })
    @IsOptional()
    insurancePlanId?: string[];

    @IsString({ each: true })
    @IsOptional()
    specialityId?: string[];

    @IsString({ each: true })
    @IsOptional()
    procedureId?: string[];

    @IsString({ each: true })
    @IsOptional()
    doctorId?: string[];

    @IsString({ each: true })
    @IsOptional()
    appointmentTypeId?: string[];

    @IsString({ each: true })
    @IsOptional()
    planCategoryId?: string[];

    @IsString({ each: true })
    @IsOptional()
    insuranceSubPlanId?: string[];

    @IsString({ each: true })
    @IsOptional()
    occupationAreaId?: string[];

    @IsString({ each: true })
    @IsOptional()
    organizationUnitLocationId?: string[];

    @IsString({ each: true })
    @IsOptional()
    reasonId?: string[];

    @IsString()
    integrationId: string;

    @IsString()
    workspaceId: string;

    @IsString()
    @IsEnum(FlowType)
    type: FlowType;

    @IsString({ each: true })
    @IsOptional()
    step?: HealthFlowSteps[];

    @IsBoolean()
    @IsOptional()
    complete?: boolean;

    @IsBoolean()
    @IsOptional()
    inactive?: boolean;

    @IsNumber()
    @IsOptional()
    maximumAge?: number;

    @IsNumber()
    @IsOptional()
    minimumAge?: number;

    @IsEnum(FlowPeriodOfDay)
    @IsOptional()
    periodOfDay?: number;

    @IsString()
    @IsOptional()
    sex?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString({ each: true })
    @IsOptional()
    cpfs?: string[];

    @IsNumber()
    @IsOptional()
    executeFrom?: number;

    @IsNumber()
    @IsOptional()
    executeUntil?: number;

    @IsNumber()
    @IsOptional()
    runBetweenStart?: number;

    @IsNumber()
    @IsOptional()
    runBetweenEnd?: number;

    @IsString({ each: true })
    @IsOptional()
    trigger?: FlowTriggerType[];

    actions?: FlowAction[];
}
