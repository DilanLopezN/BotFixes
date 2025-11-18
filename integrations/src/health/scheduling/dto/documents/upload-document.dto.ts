import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @ApiProperty()
  scheduleCode: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description?: string;

  @IsString()
  @ApiProperty()
  appointmentTypeCode: string;

  @IsString()
  @ApiProperty()
  fileTypeCode: string;
}
