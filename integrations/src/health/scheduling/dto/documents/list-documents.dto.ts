import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ListDocumentsDto {
  @IsString()
  @ApiProperty()
  scheduleCode: string;
}
