import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';

export class ListPatientSuggestedDataDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  cpf?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  bornDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  code?: string;

  @IsOptional()
  @ApiProperty()
  filter?: CorrelationFilter;
}
