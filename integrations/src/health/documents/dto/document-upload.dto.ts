import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

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
  @ApiProperty()
  patientCode: string;
}
