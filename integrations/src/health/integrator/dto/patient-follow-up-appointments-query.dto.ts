import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

class PatientFollowUpSchedulesQueryDto {
  @ApiProperty()
  @IsString()
  patientCode: string;
}

export { PatientFollowUpSchedulesQueryDto };
