import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicAuthGuard } from '../guards/public-auth.guard';
import { AuthGuard } from '../../../../../common/guards/auth.guard';
import { PublicScheduleService } from '../services/public-schedule.service';
import { PublicAuthService } from '../services/public-auth.service';
import {
  GravarAgendamentoDto,
  GravarAgendamentoResponseDto,
  ConsultarStatusAgendamentoResponseDto,
} from '../dto/gravar-agendamento.dto';
import {
  CreateAuthTokenDto,
  CreateAuthTokenResponseDto,
  DeactivateAuthTokenDto,
  DeactivateAuthTokenResponseDto,
} from '../dto/create-auth-token.dto';
import { Request } from 'express';

@ApiTags('Botdesigner Public Schedule')
@Controller('botdesigner/public/schedule')
export class BotdesignerPublicScheduleController {
  constructor(
    private readonly publicScheduleService: PublicScheduleService,
    private readonly publicAuthService: PublicAuthService,
  ) {}

  /**
   * Rota para criar tokens de autenticação para integrações
   *
   * Esta rota permite a criação de novos tokens UUID que serão usados para autenticar
   * requisições das integrações. O token pode ser fornecido ou será gerado automaticamente.
   *
   * Autenticação: Requer API_TOKEN do projeto (variável de ambiente API_TOKEN)
   * Guard usado: AuthGuard
   *
   * @param dto - Dados necessários: integrationId (obrigatório) e token (opcional)
   * @returns Informações do token criado incluindo o UUID gerado
   */
  @Post('auth-token')
  @UseGuards(AuthGuard)
  async createAuthToken(@Body() dto: CreateAuthTokenDto): Promise<CreateAuthTokenResponseDto> {
    const authToken = await this.publicAuthService.createTokenWithAutoGeneration(dto.integrationId);

    return {
      id: authToken.id,
      token: authToken.token,
      integrationId: authToken.integrationId,
      isActive: authToken.isActive,
      createdAt: authToken.createdAt,
    };
  }

  /**
   * Rota para inativar um token de autenticação
   *
   * Esta rota permite desativar um token existente, impedindo que ele seja usado
   * para autenticar requisições futuras. O token não é deletado, apenas marcado
   * como inativo (isActive = false).
   *
   * Autenticação: Requer API_TOKEN do projeto (variável de ambiente API_TOKEN)
   * Guard usado: AuthGuard
   *
   * @param dto - Token UUID a ser inativado
   * @returns Mensagem de confirmação
   */
  @Post('auth-token/deactivate')
  @UseGuards(AuthGuard)
  async deactivateAuthToken(@Body() dto: DeactivateAuthTokenDto): Promise<DeactivateAuthTokenResponseDto> {
    await this.publicAuthService.deactivateToken(dto.token);

    return {
      message: 'Token inativado com sucesso',
      token: dto.token,
    };
  }

  /**
   * Rota para gravar/criar novos agendamentos médicos
   *
   * Esta rota recebe os dados de um agendamento médico e cria uma transação para
   * processamento assíncrono. O agendamento é enviado para uma fila RabbitMQ e
   * posteriormente processado para envio ao sistema TDSA.
   *
   * Autenticação: Requer token de integração criado via rota /auth-token
   * Guard usado: PublicAuthGuard (valida token UUID da integração)
   *
   * @param req - Request contendo o integrationId extraído do token
   * @param dto - Dados completos do agendamento (paciente, médico, convênio, datas, etc)
   * @returns requestId para consultar o status do processamento + status inicial
   */
  @Post('gravar-agendamento')
  @UseGuards(PublicAuthGuard)
  async gravarAgendamento(
    @Req() req: Request & { integrationId: string; authTokenId: number },
    @Body() dto: GravarAgendamentoDto,
  ): Promise<GravarAgendamentoResponseDto> {
    const { integrationId, authTokenId } = req;
    return await this.publicScheduleService.gravarAgendamento(integrationId, dto, authTokenId);
  }

  /**
   * Rota para consultar o status de processamento de um agendamento
   *
   * Esta rota permite verificar o status atual de um agendamento que foi enviado
   * anteriormente através da rota /gravar-agendamento. Retorna informações sobre
   * o estado do processamento (pending, processing, completed, failed) e dados
   * adicionais do resultado quando disponível.
   *
   * Autenticação: Requer token de integração criado via rota /auth-token
   * Guard usado: PublicAuthGuard (valida token UUID da integração)
   *
   * @param requestId - ID da requisição retornado ao criar o agendamento
   * @returns Status atual, datas de criação/atualização e dados do processamento
   */
  @Get('status/:requestId')
  @UseGuards(PublicAuthGuard)
  async consultarStatusAgendamento(
    @Param('requestId') requestId: string,
  ): Promise<ConsultarStatusAgendamentoResponseDto> {
    return await this.publicScheduleService.consultarStatusAgendamento(requestId);
  }
}
