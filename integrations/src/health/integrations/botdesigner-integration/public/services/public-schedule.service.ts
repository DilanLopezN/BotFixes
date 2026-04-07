import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { v4 as uuidv4 } from 'uuid';
import { GravarAgendamentoResponseDto, ConsultarStatusAgendamentoResponseDto } from '../dto/gravar-agendamento.dto';
import { IGravarAgendamento } from '../interfaces/gravar-agendamento.interface';
import {
  BotdesignerPublicTransaction,
  BotdesignerPublicTransactionStatus,
} from '../entities/botdesigner-public-transaction.entity';
import { IntegrationService } from '../../../../integration/integration.service';
import { HTTP_ERROR_THROWER } from '../../../../../common/exceptions.service';
import { INTEGRATIONS_CONNECTION_NAME } from '../../../../ormconfig';
import { PublicScheduleQueueMessage } from './public-schedule-consumer.service';

@Injectable()
export class PublicScheduleService {
  private readonly logger = new Logger(PublicScheduleService.name);
  private readonly HOURLY_LIMIT = 500;
  private readonly DAILY_LIMIT = 5_000;

  constructor(
    @InjectRepository(BotdesignerPublicTransaction, INTEGRATIONS_CONNECTION_NAME)
    private readonly publicTransactionRepository: Repository<BotdesignerPublicTransaction>,
    private readonly integrationService: IntegrationService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async gravarAgendamento(
    integrationId: string,
    data: IGravarAgendamento,
    authTokenId: number,
  ): Promise<GravarAgendamentoResponseDto> {
    const methodName = 'gravarAgendamento';
    const requestId = uuidv4();

    try {
      if (!integrationId) {
        throw HTTP_ERROR_THROWER(HttpStatus.UNAUTHORIZED, 'Unauthorized', undefined, true);
      }

      const integration = await this.integrationService.getOne(integrationId);

      if (!integration || !integration.enabled) {
        throw HTTP_ERROR_THROWER(HttpStatus.UNAUTHORIZED, 'Unauthorized', undefined, true);
      }

      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const hourCount = await this.publicTransactionRepository.count({
        where: {
          integrationId,
          methodName,
          createdAt: Between(oneHourAgo, new Date()),
        },
      });

      if (hourCount >= this.HOURLY_LIMIT) {
        throw HTTP_ERROR_THROWER(HttpStatus.TOO_MANY_REQUESTS, 'Hourly limit exceeded', undefined, true);
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayCount = await this.publicTransactionRepository.count({
        where: {
          integrationId,
          methodName,
          createdAt: Between(startOfDay, endOfDay),
        },
      });

      if (todayCount >= this.DAILY_LIMIT) {
        throw HTTP_ERROR_THROWER(HttpStatus.TOO_MANY_REQUESTS, 'Daily limit exceeded', undefined, true);
      }

      const transaction = this.publicTransactionRepository.create({
        requestId,
        integrationId,
        authTokenId,
        methodName,
        status: BotdesignerPublicTransactionStatus.PENDING,
        inputPayload: data,
        outputPayload: null,
        extra: null,
        data: null,
        errorMessage: null,
      });

      await this.publicTransactionRepository.save(transaction);

      const message: PublicScheduleQueueMessage = {
        requestId,
        integrationId,
        originalPayload: data,
      };

      await this.amqpConnection.publish(process.env.EVENT_EXCHANGE_NAME, 'public.schedule.create', message, {
        persistent: true,
      });

      return {
        requestId,
        status: BotdesignerPublicTransactionStatus.PENDING,
      };
    } catch (error) {
      this.logger.error(`Error queueing schedule creation: ${error.message}`, error.stack);

      if (requestId) {
        await this.publicTransactionRepository.update(
          { requestId },
          {
            status: BotdesignerPublicTransactionStatus.FAILED,
            errorMessage: error.message,
            extra: {
              error: error.message,
              stack: error.stack,
            },
          },
        );
      }

      throw error;
    }
  }

  async consultarStatusAgendamento(requestId: string): Promise<ConsultarStatusAgendamentoResponseDto> {
    try {
      const transaction = await this.publicTransactionRepository.findOne({
        where: { requestId },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      return {
        requestId: transaction.requestId,
        status: transaction.status,
        data: transaction.data,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }
}
