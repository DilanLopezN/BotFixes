import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class GetPatientQueryDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  @Transform((value) => String(value).replace(/\D/g, ''))
  cpf?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  code?: string;

  @IsString()
  @ApiProperty()
  bornDate: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  motherName?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  @Transform((value) => {
    if (typeof value === 'string') {
      return value === 'true';
    }

    return value;
  })
  cache?: boolean;
}
