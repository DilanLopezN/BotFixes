import { ApiProperty } from '@nestjs/swagger';
import { ResponseType } from 'kissbot-core';
import { FilterDto } from './FilterDto.dto';
import {
  ResponseElementButtonsDto,
  ResponseElementCardDto,
  ResponseElementMessageDto,
  ResponseElementSetAttributeDto,
  ResponseElementWebhookDto,
  ResponseElementGotoDto,
} from './elementTypeDto.dto';

export class ResponseDto {
  @ApiProperty({ enum: ResponseType })
  readonly type: ResponseType;

  @ApiProperty({
    isArray: true,
    type: ResponseElementMessageDto,
  })
  readonly elements:
    | ResponseElementButtonsDto[]
    | ResponseElementCardDto[]
    | ResponseElementMessageDto[]
    | ResponseElementWebhookDto[]
    | ResponseElementSetAttributeDto[]
    | ResponseElementGotoDto[];

  @ApiProperty()
  readonly buttons: string;

  @ApiProperty()
  readonly delay: number;

  @ApiProperty()
  readonly sendTypping: boolean;

  @ApiProperty()
  readonly filters: FilterDto;
}
