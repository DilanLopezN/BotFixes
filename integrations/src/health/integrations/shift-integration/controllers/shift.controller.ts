import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ShiftKeyGuard } from '../shift-key.guard';
import { AuditInterceptor } from '../../../../common/interceptors/audit.interceptor';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { ReportSendingDto } from '../dto/report-sending.dto';
import { ShiftService } from '../services/shift.service';

@UseInterceptors(AuditInterceptor)
@Controller('shift')
@ApiTags('Shift Integration')
export class ShiftController {
  private readonly logger = new Logger(ShiftController.name);

  constructor(private readonly shiftService: ShiftService) {}

  /**
   * Endpoint RPC para receber notificação de envio de laudo
   * @param payload - Dados do laudo enviado
   * @returns OkResponse
   */
  @Post('reportSending')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ShiftKeyGuard)
  async reportSending(@Body() payload: ReportSendingDto): Promise<OkResponse> {
    try {
      this.logger.log(`Received reportSending for patient: ${payload.patientCode}, schedule: ${payload.scheduleCode}`);
      return await this.shiftService.reportSending(payload);
    } catch (error) {
      this.logger.error('Error processing reportSending', error);
      throw error;
    }
  }
}
