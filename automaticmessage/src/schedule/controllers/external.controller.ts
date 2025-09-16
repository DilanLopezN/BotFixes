import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { SendScheduleDto } from '../dto/external-send-active-schedule.dto';
import { SendActiveScheduleIncomingService } from '../services/external-incoming/send-active-schedule-incoming.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('External Schedules')
@Controller('external')
export class ExternalController {
  constructor(
    private readonly sendActiveScheduleIncomingService: SendActiveScheduleIncomingService,
  ) {}

  @Post('sendMessage')
  @ApiOperation({ summary: 'Send a scheduled message via external API' })
  @ApiResponse({ status: 200, description: 'Message scheduled successfully', type: Object })
  async sendActiveSchedule(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: SendScheduleDto,
  ): Promise<{ requestId: string } | null> {
    return await this.sendActiveScheduleIncomingService.enqueueSendActiveSchedule(
      body,
    );
  }

  @Post('getWorkspaceId')
  @ApiOperation({ summary: 'Send a scheduled message via external API' })
  @ApiResponse({ status: 200, type: Object })
  async getWorkspaceId(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: SendScheduleDto,
  ): Promise<{ workspaceId: string } | null> {
    return await this.sendActiveScheduleIncomingService.getWorkspaceId(
      body,
    );
  }
}
