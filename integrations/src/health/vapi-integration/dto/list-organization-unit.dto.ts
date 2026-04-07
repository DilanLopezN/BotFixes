import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { OrganizationUnitOutput } from '../interfaces/entities-output.interface';

export class ListOrganizationUnitParamsDto extends DefaultEntitiesDto {}

export class ListOrganizationUnitInputDto {
  @ValidateNested()
  @Type(() => ListOrganizationUnitParamsDto)
  @ApiProperty({ type: ListOrganizationUnitParamsDto })
  params: ListOrganizationUnitParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListOrganizationUnitOutputDto implements OrganizationUnitOutput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
