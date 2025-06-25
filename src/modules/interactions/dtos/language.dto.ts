import { ApiProperty } from '@nestjs/swagger';
import { UserSayDto } from './userSayDto.dto';
import { ResponseDto } from './responseDto.dto';

//@TODO: Validate ?
export class LanguageInteractionDto {

  @ApiProperty()
  readonly language : string

  @ApiProperty({ type: ResponseDto, isArray: true })
  //@IsString()
  readonly responses: ResponseDto[];

  @ApiProperty({ type: UserSayDto, isArray: true })
  //@IsString()
  readonly userSays: UserSayDto[];
}