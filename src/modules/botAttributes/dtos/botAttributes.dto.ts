import { ApiProperty } from '@nestjs/swagger';

export class BotAttributesDto {
  @ApiProperty()
  readonly name: string;

  @ApiProperty({ isArray: true, type: String })
  readonly interactions: string[];

  @ApiProperty()
  readonly botId: string;

  @ApiProperty()
  readonly type: string;

  @ApiProperty({ type: String })
  readonly label: string;
}
