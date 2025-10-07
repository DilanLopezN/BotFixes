import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ScheduleSettingService } from '../services/schedule/schedule-setting.service';
import {
  CreateScheduleSettingDto,
  UpdateScheduleSettingDto,
  ListScheduleSettingDto,
  GetScheduleSettingByIdDto,
  CreateAllSettingsDto,
  UpdateAllSettingsDto
} from '../dto/schedule-setting.dto';
import {
  CreateSendSettingData,
} from '../interfaces/send-setting-data.interface';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckScheduleTemplateUsageDto } from '../dto/check-schedule-template-usage.dto';

@ApiTags('ScheduleSetting')
@Controller('schedule-setting')
export class ScheduleSettingController {
  constructor(
    private readonly scheduleSettingService: ScheduleSettingService,
  ) {}
  
  @Post('create')
  @ApiOperation({ summary: 'Create a new schedule setting' })
  @ApiBody({ type: CreateScheduleSettingDto })
  @ApiResponse({ status: 201, description: 'Schedule setting created successfully', type: Object })
  async createScheduleSetting(
    @Body()
    body: CreateScheduleSettingDto,
  ) {
    return await this.scheduleSettingService.createScheduleSetting({
      ...body,
      workspaceId: body.workspaceId,
    });
  }

  @Post('update')
  @ApiOperation({ summary: 'Update an existing schedule setting' })
  @ApiBody({ type: UpdateScheduleSettingDto })
  @ApiResponse({ status: 200, description: 'Schedule setting updated successfully', type: Object })
  async updateScheduleSetting(
    @Body()
    body: UpdateScheduleSettingDto,
  ) {
    return await this.scheduleSettingService.updateScheduleSetting({
      active: body.active,
      name: body.name,
      getScheduleInterval: body.getScheduleInterval,
      integrationId: body.integrationId,
      id: body.scheduleSettingId,
      workspaceId: body.workspaceId,
      extractAt: body.extractAt,
      extractRule: body.extractRule,
      useSpecialityOnExamMessage: body.useSpecialityOnExamMessage,
      sendOnlyPrincipalExam: body.sendOnlyPrincipalExam,
      enableSendRetry: body.enableSendRetry,
      enableResendNotAnswered: body.enableResendNotAnswered,
      useOrganizationUnitOnGroupDescription:
        body.useOrganizationUnitOnGroupDescription,
      omitAppointmentTypeName: body.omitAppointmentTypeName,
      omitDoctorName: body.omitDoctorName,
      omitExtractGuidance: body.omitExtractGuidance,
      fridayJoinWeekendMonday: body.fridayJoinWeekendMonday,
      checkScheduleChanges: body.checkScheduleChanges,
      omitTimeOnGroupDescription: body.omitTimeOnGroupDescription,
      timeResendNotAnswered: body.timeResendNotAnswered,
      useIsFirstComeFirstServedAsTime: body.useIsFirstComeFirstServedAsTime,
      useSendFullDay: body.useSendFullDay,
      externalExtract: body.externalExtract,
    });
  }

  @Post('list')
  @ApiOperation({ summary: 'List all schedule settings for a workspace' })
  @ApiBody({ type: ListScheduleSettingDto })
  @ApiResponse({ status: 200, description: 'Schedule settings listed successfully', type: Array })
  async listScheduleSetting(
    @Body()
    body: ListScheduleSettingDto
  ) {
    return await this.scheduleSettingService.listByWorkspaceId(body.workspaceId);
  }

  @Post('listByAlias')
  @ApiOperation({ summary: 'List all schedule settings for a workspace' })
  @ApiBody({ type: ListScheduleSettingDto })
  @ApiResponse({ status: 200, description: 'Schedule settings listed successfully', type: Array })
  async listScheduleSettingByAlias(
    @Body()
    body: ListScheduleSettingDto
  ) {
    return await this.scheduleSettingService.listByWorkspaceIdWithAlias(body.workspaceId);
  }

  @Post('getById')
  @ApiOperation({ summary: 'Get a schedule setting by ID' })
  @ApiBody({ type: GetScheduleSettingByIdDto })
  @ApiResponse({ status: 200, description: 'Schedule setting retrieved successfully', type: Object })
  async scheduleSettingByIdAndWorkspace(
    @Body()
    body: GetScheduleSettingByIdDto
  ) {
    return await this.scheduleSettingService.getScheduleSettingByIdAndWorkspaceWithSendSetting(
      body.workspaceId,
      Number(body.scheduleSettingId),
    );
  }

  @Post('createAllSettings')
  @ApiOperation({ summary: 'Create schedule setting with all related settings' })
  @ApiBody({ type: CreateAllSettingsDto })
  @ApiResponse({ status: 201, description: 'All settings created successfully', type: Object })
  async createAllSettings(
    @Body()
    body: CreateAllSettingsDto
  ) {
    const newSendSettings: CreateSendSettingData[] = body?.sendSettings?.map(
      (sendSett) => ({
        active: sendSett.active,
        apiToken: sendSett.apiToken,
        templateId: sendSett.templateId,
        type: sendSett.type,
        workspaceId: body.workspaceId,
        erpParams: sendSett.erpParams,
        retryInvalid: sendSett.retryInvalid,
        resendMsgNoMatch: sendSett.resendMsgNoMatch,
        hoursBeforeScheduleDate: sendSett.hoursBeforeScheduleDate,
        scheduleGroupRule: sendSett.groupRule,
        sendRecipientType: sendSett.sendRecipientType,
        emailSendingSettingId: sendSett.emailSendingSettingId,
        sendingGroupType: sendSett.sendingGroupType,
      }),
    );
    return await this.scheduleSettingService.createScheduleSettingAndVinculedSettings(
      body.workspaceId,
      {
        confirmation: {
          active: body.confirmation.active,
          apiToken: body.confirmation.apiToken,
          templateId: body.confirmation.templateId,
          retryInvalid: body.confirmation.retryInvalid,
          resendMsgNoMatch: body.confirmation.resendMsgNoMatch,
          erpParams: body.confirmation.erpParams,
          groupRule: body.confirmation.groupRule,
          sendRecipientType: body.confirmation.sendRecipientType,
          emailSendingSettingId: body.confirmation.emailSendingSettingId,
          sendingGroupType: body.confirmation.sendingGroupType,
          workspaceId: body.workspaceId,
        },
        schedule: {
          active: body.schedule.active,
          name: body.schedule.name,
          getScheduleInterval: body.schedule.getScheduleInterval,
          integrationId: body.schedule.integrationId,
          workspaceId: body.workspaceId,
          extractAt: body.schedule.extractAt,
          extractRule: body.schedule.extractRule,
          useSpecialityOnExamMessage: body.schedule.useSpecialityOnExamMessage,
          sendOnlyPrincipalExam: body.schedule.sendOnlyPrincipalExam,
          enableSendRetry: body.schedule.enableSendRetry,
          enableResendNotAnswered: body.schedule.enableResendNotAnswered,
          useOrganizationUnitOnGroupDescription:
            body.schedule.useOrganizationUnitOnGroupDescription,
          omitAppointmentTypeName: body.schedule.omitAppointmentTypeName,
          omitDoctorName: body.schedule.omitDoctorName,
          omitExtractGuidance: body.schedule.omitExtractGuidance,
          fridayJoinWeekendMonday: body.schedule.fridayJoinWeekendMonday,
          checkScheduleChanges: body.schedule.checkScheduleChanges,
          omitTimeOnGroupDescription: body.schedule.omitTimeOnGroupDescription,
          useIsFirstComeFirstServedAsTime:
            body.schedule.useIsFirstComeFirstServedAsTime,
          timeResendNotAnswered: body.schedule.timeResendNotAnswered,
          useSendFullDay: body.schedule.useSendFullDay,
          externalExtract: body.schedule.externalExtract,
        },
        reminder: {
          active: body.reminder.active,
          apiToken: body.reminder.apiToken,
          templateId: body.reminder.templateId,
          sendBeforeScheduleDate: body.reminder.sendBeforeScheduleDate,
          retryInvalid: body.reminder.retryInvalid,
          erpParams: body.reminder.erpParams,
          groupRule: body.reminder.groupRule,
          sendRecipientType: body.reminder.sendRecipientType,
          emailSendingSettingId: body.reminder.emailSendingSettingId,
          sendingGroupType: body.reminder.sendingGroupType,
          workspaceId: body.workspaceId,
        },
        sendSettings: newSendSettings,
      },
    );
  }

  @Post('updateAllSettings')
  @ApiOperation({ summary: 'Update schedule setting with all related settings' })
  @ApiBody({ type: UpdateAllSettingsDto })
  @ApiResponse({ status: 200, description: 'All settings updated successfully', type: Object })
  async updateConfirmationSettingAndScheduleSetting(
    @Body()
    body: UpdateAllSettingsDto
  ) {
    return await this.scheduleSettingService.updateScheduleSettingAndVinculedSettings(
      body.workspaceId,
      body.scheduleSettingId,
      {
        schedule: {
          ...body.schedule,
          workspaceId: body.workspaceId,
        },
        confirmation: { ...body.confirmation, workspaceId: body.workspaceId },
        reminder: { ...body.reminder, workspaceId: body.workspaceId },
        sendSettings: body?.sendSettings,
      },
    );
  }

  @Post('checkScheduleTemplateUsage')
  async checkScheduleTemplateUsage(
    @Body()
    body: CheckScheduleTemplateUsageDto
  ) {
    return await this.scheduleSettingService.checkScheduleTemplateUsage(
      body.workspaceId,
      body.templateId,
    );
  }
}