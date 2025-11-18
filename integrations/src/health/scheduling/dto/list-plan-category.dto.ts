import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { PlanCategoryOutput } from '../interfaces/entities-output.interface';

export class ListPlanCategoryParamsDto extends DefaultEntitiesDto {}

export class ListPlanCategoryInputDto {
  @ValidateNested()
  @Type(() => ListPlanCategoryParamsDto)
  @ApiProperty({ type: ListPlanCategoryParamsDto })
  params: ListPlanCategoryParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListPlanCategoryOutputDto implements PlanCategoryOutput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
