import { ApiProperty } from '@nestjs/swagger';
import { SetAttributeAction } from '../interfaces/responseType.interface';

export class ResponseElementMessageDto {
  @ApiProperty()
  //@IsString()
  readonly text: string;
}

export class ResponseElementWebhookDto {
  @ApiProperty()
  //@IsString()
  readonly webhookId: string;
}

export class ResponseElementButtonsDto {
  @ApiProperty()
  //@IsString()
  readonly title: string;

  @ApiProperty()
  readonly subtitle: string;

  @ApiProperty()
  readonly text: string;


  @ApiProperty({ type: ResponseElementButtonsDto })
  //@IsString()
  readonly buttons: ResponseElementButtonsDto[];
}

export class ResponseElementCardDto {
  @ApiProperty()
  readonly title: string;

  @ApiProperty()
  readonly subtitle: string;

  @ApiProperty()
  readonly text: string;

  @ApiProperty()
  readonly imageUrl: string;
}

export class ResponseElementSetAttributeDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  action: SetAttributeAction;

  @ApiProperty()
  value: string;
}

export class ResponseElementGotoDto {
  @ApiProperty()
  //@IsString()
  readonly value: string;
}
