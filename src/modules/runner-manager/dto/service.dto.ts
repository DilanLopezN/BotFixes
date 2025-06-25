import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EnvTypes } from '../models/service.entity';

export class CreateServiceDto {
    @IsString()
    integrationId: string;

    @IsEnum(EnvTypes)
    env: EnvTypes;
}

export class UpdateServiceDto extends CreateServiceDto {
    @IsNumber()
    id: number;

    @IsNumber()
    runnerId: number;

    @IsOptional()
    createdAt: Date;
}
