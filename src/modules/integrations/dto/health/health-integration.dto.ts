import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IntegrationInternalApi, Routines } from '../../interfaces/health/health-integration.interface';

export class CreateHealthIntegrationDto {
    @IsString()
    @ApiProperty()
    name: string;

    @IsOptional()
    @ApiProperty()
    entitiesToSync?: string[];

    @IsOptional()
    @ApiProperty()
    entitiesFlow?: string[];

    @IsString()
    @ApiProperty()
    workspaceId: string;

    @IsString()
    @ApiProperty()
    type: string;

    @ApiProperty()
    rules: any;

    @IsOptional()
    @IsString()
    @ApiProperty()
    environment?: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    syncType?: string;

    @IsOptional()
    @IsBoolean()
    @ApiProperty()
    debug?: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiProperty()
    auditRequests?: boolean;

    @IsOptional()
    @ApiProperty()
    internalApi?: IntegrationInternalApi;

    @IsOptional()
    @ApiProperty()
    routines?: Routines;

    @IsOptional()
    @ApiProperty()
    messages?: any;
}

export class UpdateHealthIntegrationDto extends CreateHealthIntegrationDto {
    _id: string;
}
