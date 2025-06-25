import { ApiProperty } from '@nestjs/swagger';

export class FallbackDto {
  @ApiProperty()
  readonly assinedTo: string;

  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  readonly textSolved: string;

  @ApiProperty()
  readonly tags: string[];
}
