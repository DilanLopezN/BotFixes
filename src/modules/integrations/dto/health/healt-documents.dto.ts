import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DocumentUploadDto {
    @IsString()
    @ApiProperty()
    scheduleCode: string;

    @IsString()
    @ApiProperty()
    description?: string;

    @IsString()
    @ApiProperty()
    appointmentTypeCode: string;

    @IsString()
    @ApiProperty()
    fileTypeCode: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    externalId?: string;
}

export class ListDocumentsDto {
    @IsString()
    @ApiProperty()
    scheduleCode: string;
}

export class ListPatientSchedulesDto {}

export class AuthenticatePatientDto {
    @IsString()
    @ApiProperty()
    patientCpf: string;
}
