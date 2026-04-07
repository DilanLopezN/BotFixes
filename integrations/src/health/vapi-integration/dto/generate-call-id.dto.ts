import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class GenerateCallIdOutputDto {
  @IsString()
  @IsUUID()
  @ApiProperty({ description: 'Generated Call ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  callId: string;
}
