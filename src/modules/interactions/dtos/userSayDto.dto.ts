import { ApiProperty } from '@nestjs/swagger';

export class PartDto {
  @ApiProperty()
  readonly value: string;
  @ApiProperty()
  readonly type?: string;
  @ApiProperty()
  name?: string;
}

export class UserSayDto {
  @ApiProperty({ type: PartDto, isArray: true })
  readonly parts: PartDto[];
  @ApiProperty()
  readonly recognizer: string;
}
