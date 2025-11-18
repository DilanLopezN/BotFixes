import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { OrganizationUnitLocationOutput } from '../interfaces/entities-output.interface';

export class ListOrganizationUnitLocationParamsDto extends DefaultEntitiesDto {}

export class ListOrganizationUnitLocationInputDto {
  @ValidateNested()
  @Type(() => ListOrganizationUnitLocationParamsDto)
  @ApiProperty({ type: ListOrganizationUnitLocationParamsDto })
  params: ListOrganizationUnitLocationParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListOrganizationUnitLocationOutputDto implements OrganizationUnitLocationOutput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
