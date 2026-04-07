import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class GravarAgendamentoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoAgenda?: string;

  @ApiProperty()
  @IsString()
  dataAgendamentoInicial: string;

  @ApiProperty()
  @IsString()
  dataAgendamentoFinal: string;

  @IsString()
  codigoUnidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoMedico?: string;

  @ApiProperty()
  @IsString()
  codigoConvenio: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoConvenioPlano?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoConvenioCategoria?: string;

  @ApiProperty()
  @IsString()
  codigoTipoAgendamento: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoEspecialidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoProcedimento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoClassificacao?: string;

  @ApiProperty()
  @IsString()
  pacienteCodigo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pacienteAltura?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pacientePeso?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pacienteGenero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pacienteIdade?: string;
}

export class GravarAgendamentoResponseDto {
  @ApiProperty({ description: 'ID da requisição para consultar o status do processamento' })
  requestId: string;

  @ApiProperty({ description: 'Status atual da requisição', enum: ['pending', 'processing', 'completed', 'failed'] })
  status: string;
}

export class ConsultarStatusAgendamentoResponseDto {
  @ApiProperty({ description: 'ID da requisição' })
  requestId: string;

  @ApiProperty({ description: 'Status atual da requisição', enum: ['pending', 'processing', 'completed', 'failed'] })
  status: string;

  @ApiPropertyOptional({ description: 'Dados extras do processamento' })
  extra?: any;

  @ApiPropertyOptional({ description: 'Dados do agendamento' })
  data?: any;

  @ApiProperty({ description: 'Data de criação da requisição' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;
}
