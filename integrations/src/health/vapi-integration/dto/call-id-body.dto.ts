import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CallIdDto {
  @IsString()
  @ApiProperty({ required: true, description: 'Call ID', example: 'call-123' })
  callId: string;
}
