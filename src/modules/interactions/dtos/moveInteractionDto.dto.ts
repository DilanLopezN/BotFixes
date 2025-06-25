import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

//@TODO: Validate ?
export class MoveInteractionDto {
  @ApiProperty()
  //@IsString()
  readonly position: Number;
}
