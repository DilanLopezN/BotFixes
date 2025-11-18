import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExtractType } from '../interfaces';

export class ListSchedulesToConfirmDto {
  @IsNumber()
  @ApiProperty()
  startDate: number;

  @IsNumber()
  @ApiProperty()
  endDate: number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  contactCode: string;

  @IsNumber()
  @ApiProperty()
  offset: number;

  @IsNumber()
  @ApiProperty()
  limit: number;
}

export class ConfirmationErpParamsDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty()
  debugLimit?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  debugPhoneNumber?: number;

  @IsOptional()
  @ApiProperty()
  EXTRACT_TYPE?: ExtractType;
}

export class ListSchedulesToConfirmV2Dto {
  @IsString()
  @ApiProperty()
  startDate: string;

  @IsString()
  @ApiProperty()
  endDate: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  scheduleCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  page: number;

  @IsOptional()
  @IsObject()
  @ApiProperty({ type: ConfirmationErpParamsDto })
  erpParams?: ConfirmationErpParamsDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  maxResults: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  buildShortLink?: boolean;
}
