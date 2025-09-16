import { Body, Controller, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ReminderSettingService } from '../services/reminder/reminder-setting.service';
import { CreateReminderSettingDto, UpdateReminderSettingDto } from '../dto/reminder-setting.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('ReminderSetting')
@Controller('reminder-setting')
export class ReminderSettingController {
  constructor(
    private readonly reminderSettingService: ReminderSettingService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new reminder setting' })
  @ApiBody({ type: CreateReminderSettingDto })
  @ApiResponse({ status: 201, description: 'Reminder setting created successfully', type: Object })
  async createReminderSetting(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: CreateReminderSettingDto,
  ) {
    return await this.reminderSettingService.createReminderSetting({
      apiToken: body.apiToken,
      active: body.active,
      scheduleSettingId: body.scheduleSettingId,
      templateId: body.templateId,
      sendBeforeScheduleDate: body.sendBeforeScheduleDate,
      retryInvalid: body.retryInvalid,
      sendRecipientType: body.sendRecipientType,
      workspaceId: body.workspaceId,
      erpParams: body.erpParams,
      groupRule: body.groupRule,
      emailSendingSettingId: body.emailSendingSettingId,
      sendingGroupType: body.sendingGroupType
    });
  }
  
  @Post('update')
  @ApiOperation({ summary: 'Update an existing reminder setting' })
  @ApiBody({ type: UpdateReminderSettingDto })
  @ApiResponse({ status: 200, description: 'Reminder setting updated successfully', type: Object })
  async updateReminderSetting(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: UpdateReminderSettingDto,
  ) {
    return await this.reminderSettingService.updateReminderSetting(body);
  }
}
