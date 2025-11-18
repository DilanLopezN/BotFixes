import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { AuthGuard } from '../../../common/guards/auth.guard';
import {
  CancelAppointmentV2Dto,
  ConfirmAppointmentV2Dto,
  ListSchedulesToConfirmV2Dto,
  ValidateScheduleConfirmationDto,
  MatchFlowsConfirmationDto,
  GetScheduleGuidanceDto,
} from '../dto';
import { IntegratorService } from '.././service/integrator.service';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { AuditInterceptor } from '../../../common/interceptors/audit.interceptor';
import { ConfirmationSchedule } from '../../interfaces/confirmation-schedule.interface';
import { FlowAction } from '../../flow/interfaces/flow.interface';
import { ConfirmationScheduleGuidanceResponse } from '../interfaces';
import { OmitAudit } from '../../../common/decorators/audit.decorator';
import { GetScheduleByIdDto } from '../dto/get-schedule-by-id.dto';
import { Schedules } from '../../schedules/entities/schedules.entity';

@UseGuards(AuthGuard)
@UseInterceptors(AuditInterceptor)
@Controller({
  path: 'integration/:integrationId/health/confirmation',
})
export class ConfirmationController {
  private logger = new Logger(ConfirmationController.name);
  private readonly debug = process.env.NODE_ENV === 'local' && false;

  constructor(private readonly integratorService: IntegratorService) {}

  private debugRequest(data: any) {
    if (this.debug) {
      this.logger.debug(JSON.stringify(data));
    }
  }

  @ApiTags('Schedule')
  @HttpCode(HttpStatus.OK)
  @Post('cancelSchedule')
  async cancelSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: CancelAppointmentV2Dto,
  ): Promise<OkResponse> {
    this.debugRequest(dto);
    return await this.integratorService.cancelScheduleV2(integrationId, dto);
  }

  @ApiTags('Schedule')
  @HttpCode(HttpStatus.OK)
  @Post('confirmSchedule')
  async confirmSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ConfirmAppointmentV2Dto,
  ) {
    this.debugRequest(dto);
    return await this.integratorService.confirmScheduleV2(integrationId, dto);
  }

  @ApiTags('Schedule')
  @HttpCode(HttpStatus.OK)
  @Post('listSchedules')
  async listSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ListSchedulesToConfirmV2Dto,
  ): Promise<ConfirmationSchedule> {
    return await this.integratorService.listSchedulesToConfirm(integrationId, dto);
  }

  @ApiTags('Flow')
  @HttpCode(HttpStatus.OK)
  @OmitAudit()
  @Post('matchFlows')
  async matchFlowsFromFilters(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: MatchFlowsConfirmationDto,
  ): Promise<FlowAction[]> {
    this.debugRequest(dto);
    return await this.integratorService.matchFlowsConfirmation(integrationId, dto);
  }

  @ApiTags('Flow')
  @HttpCode(HttpStatus.OK)
  @OmitAudit()
  @Post('validateScheduleData')
  async validateScheduleData(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ValidateScheduleConfirmationDto,
  ): Promise<OkResponse> {
    this.debugRequest(dto);
    return await this.integratorService.validateScheduleData(integrationId, dto);
  }

  @ApiTags('Flow')
  @HttpCode(HttpStatus.OK)
  @Post('getScheduleGuidance')
  async getScheduleGuidance(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: GetScheduleGuidanceDto,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    this.debugRequest(dto);
    return await this.integratorService.getConfirmationScheduleGuidance(integrationId, dto);
  }

  @ApiTags('Flow')
  @HttpCode(HttpStatus.OK)
  @Post('getConfirmationScheduleById')
  async getConfirmationScheduleById(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: GetScheduleByIdDto,
  ): Promise<Schedules> {
    this.debugRequest(dto);
    return await this.integratorService.getConfirmationScheduleById(integrationId, dto);
  }
}
