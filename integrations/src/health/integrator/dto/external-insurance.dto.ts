import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { InsuranceEntityDocument } from '../../entities/schema';
import { Patient } from '../../interfaces/patient.interface';

class PartialPatientDto implements Partial<Patient> {
  @IsString()
  @IsOptional()
  @ApiProperty()
  cpf: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '1985-11-14' })
  bornDate: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  sex: string;
}

export class ExternalInsuranceDto {
  @IsDefined()
  @ApiProperty()
  insurance: InsuranceEntityDocument;

  @IsDefined()
  @ApiProperty()
  @ValidateNested()
  @Type(() => PartialPatientDto)
  patient?: PartialPatientDto;

  @ApiProperty()
  @IsOptional()
  filter: CorrelationFilter;
}
