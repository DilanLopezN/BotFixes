import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteDocumentDto {
  @IsString()
  @ApiProperty()
  scheduleCode: string;

  @IsString()
  @ApiProperty()
  patientCode: string;

  @IsString()
  @ApiProperty()
  documentId: string;
}
