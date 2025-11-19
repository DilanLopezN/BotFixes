import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ListPatientSchedulesDto {
  @IsString()
  @ApiProperty()
  erpUsername: string;
}
