import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ScheduleService } from '../services/schedule/schedule.service';
import { ScheduleFilterListDto } from '../dto/schedule-query.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SendScheduleMessageService } from '../services/schedule-message/send-schedule-message.service';
import { ExtractResumeType } from '../models/extract-resume.entity';

@ApiTags('Schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(
    private readonly sendScheduleMessageService: SendScheduleMessageService,
    private readonly scheduleService: ScheduleService,
  ) {}

  @Post('list')
  @ApiOperation({ summary: 'List schedules with filters' })
  @ApiBody({ type: ScheduleFilterListDto })
  @ApiResponse({
    status: 200,
    description: 'Schedules listed successfully',
    type: Object,
  })
  async listSchedules(
    @Body(new ValidationPipe())
    filter: ScheduleFilterListDto,
  ) {
    return await this.scheduleService.listSchedules(
      { skip: Number(filter.skip || 0), limit: Number(filter.limit || 10) },
      { ...filter, workspaceId: filter.workspaceId },
    );
  }

  @Post('getAttributes')
  @ApiOperation({ summary: 'get schedule attributes' })
  async getAttributes(
    @Body()
    body: {
      schedule: any;
      sendType: ExtractResumeType;
    },
  ) {
    return await this.sendScheduleMessageService.getAttributes(
      body.schedule,
      body.sendType,
    );
  }

  @Post('getScheduleByScheduleId')
  @ApiOperation({ summary: 'get schedule by id' })
  async getScheduleByScheduleId(
    @Body()
    body: {
      workspaceId: string;
      scheduleId: string;
    },
  ) {
    return await this.scheduleService.getScheduleByScheduleId(
      body.workspaceId,
      body.scheduleId,
    );
  }

  @Post('getSchedulesByGroupId')
  @ApiOperation({ summary: 'get schedule by groupId' })
  async getSchedulesByGroupId(
    @Body()
    body: {
      workspaceId: string;
      groupId: string;
    },
  ) {
    return await this.scheduleService.getSchedulesByGroupId(
      body.workspaceId,
      body.groupId,
    );
  }
}
