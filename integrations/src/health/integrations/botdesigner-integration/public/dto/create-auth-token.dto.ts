import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateAuthTokenDto {
  @ApiProperty({ description: 'ID da integração (24 caracteres)' })
  @IsString()
  integrationId: string;
}

export class CreateAuthTokenResponseDto {
  @ApiProperty({ description: 'ID do token criado' })
  id: number;

  @ApiProperty({ description: 'Token UUID gerado' })
  token: string;

  @ApiProperty({ description: 'ID da integração' })
  integrationId: string;

  @ApiProperty({ description: 'Status do token' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;
}

export class DeactivateAuthTokenDto {
  @ApiProperty({ description: 'Token UUID a ser inativado' })
  @IsUUID()
  token: string;
}

export class DeactivateAuthTokenResponseDto {
  @ApiProperty({ description: 'Mensagem de sucesso' })
  message: string;

  @ApiProperty({ description: 'Token que foi inativado' })
  token: string;
}
