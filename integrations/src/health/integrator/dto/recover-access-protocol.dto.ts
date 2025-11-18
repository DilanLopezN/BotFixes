import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

class RecoverAccessProtocolDto {
  @ApiProperty()
  @IsString()
  cpf: string;

  @ApiProperty()
  @IsString()
  bornDate: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  motherName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  insuranceNumber?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  zipCode?: string;
}

export { RecoverAccessProtocolDto };
