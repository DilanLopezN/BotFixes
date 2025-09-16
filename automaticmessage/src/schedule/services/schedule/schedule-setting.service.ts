import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SCHEDULE_CONNECTION_NAME } from '../../connName';
import { ScheduleSetting } from '../../models/schedule-setting.entity';
import { v4 } from 'uuid';
import {
  CreateScheduleSettingData,
  UpdateScheduleSettingData,
} from '../../interfaces/schedule-setting-data.interface';
import { ConfirmationSetting } from '../../models/confirmation-setting.entity';
import { ReminderSetting } from '../../models/reminder-setting.entity';
import {
  CreateConfirmationSettingData,
  UpdateConfirmationSettingData,
} from '../../interfaces/confirmation-setting-data.interface';
import {
  CreateReminderSettingData,
  UpdateReminderSettingData,
} from '../../interfaces/reminder-setting-data.interface';
import { ConfirmationSettingService } from '../confirmation/confirmation-setting.service';
import { ReminderSettingService } from '../reminder/reminder-setting.service';
import { SendSetting } from '../../models/send-setting.entity';
import {
  CreateSendSettingData,
  UpdateSendSettingData,
} from '../../interfaces/send-setting-data.interface';
import { SendSettingService } from '../send-settings/send-setting.service';
import { ExtractResumeType } from '../../models/extract-resume.entity';
import {
  CatchError,
  CustomBadRequestException,
} from '../../../miscellaneous/exceptions';

@Injectable()
export class ScheduleSettingService {
  constructor(
    @InjectRepository(ScheduleSetting, SCHEDULE_CONNECTION_NAME)
    private repo: Repository<ScheduleSetting>,
    private readonly confirmationSettingService: ConfirmationSettingService,
    private readonly reminderSettingService: ReminderSettingService,
    private readonly sendSettingService: SendSettingService,
  ) {}

  // @CatchError()
  async getActiveScheduleSettings() {
    return await this.repo
      .createQueryBuilder('schSett')
      .where('schSett.active = true')
      .andWhere('schSett.external_extract <> true')
      .leftJoinAndMapMany(
        'schSett.confirmationSettings',
        ConfirmationSetting,
        'confSett',
        'confSett.active = true AND confSett.schedule_setting_id = schSett.id',
      )
      .leftJoinAndMapMany(
        'schSett.reminderSettings',
        ReminderSetting,
        'remSett',
        'remSett.active = true AND remSett.schedule_setting_id = schSett.id',
      )
      .leftJoinAndMapMany(
        'schSett.sendSettings',
        SendSetting,
        'sendSett',
        'sendSett.active = true AND sendSett.schedule_setting_id = schSett.id',
      )
      .getMany();
  }

  async getScheduleSettingByIdWithSubSettings(
    scheduleSettingId: number,
    workspaceId: string,
  ) {
    return await this.repo
      .createQueryBuilder('schSett')
      .andWhere('schSett.external_extract <> true')
      .andWhere('schSett.id = :scheduleSettingId', { scheduleSettingId })
      .andWhere('schSett.workspace_id = :workspaceId', { workspaceId })
      .leftJoinAndMapMany(
        'schSett.confirmationSettings',
        ConfirmationSetting,
        'confSett',
        'confSett.schedule_setting_id = schSett.id',
      )
      .leftJoinAndMapMany(
        'schSett.reminderSettings',
        ReminderSetting,
        'remSett',
        'remSett.schedule_setting_id = schSett.id',
      )
      .leftJoinAndMapMany(
        'schSett.sendSettings',
        SendSetting,
        'sendSett',
        'sendSett.schedule_setting_id = schSett.id',
      )
      .getOne();
  }

  @CatchError()
  async getActiveScheduleSettingByApiKeyWithSendSetting(
    apiKey: string,
    sendType: ExtractResumeType,
  ) {
    const query = this.repo
      .createQueryBuilder('schSett')
      .where('schSett.active = true')
      .andWhere('schSett.api_key = :apiKey', { apiKey })
      .andWhere('schSett.external_extract = true');

    if (sendType === ExtractResumeType.confirmation) {
      query.innerJoinAndMapMany(
        'schSett.sendSettings',
        ConfirmationSetting,
        'confSett',
        'confSett.active = true AND confSett.schedule_setting_id = schSett.id',
      );
    } else if (sendType === ExtractResumeType.reminder) {
      query.innerJoinAndMapMany(
        'schSett.sendSettings',
        ReminderSetting,
        'remSett',
        'remSett.active = true AND remSett.schedule_setting_id = schSett.id',
      );
    } else {
      query.innerJoinAndMapMany(
        'schSett.sendSettings',
        SendSetting,
        'sendSett',
        `sendSett.active = true AND sendSett.schedule_setting_id = schSett.id AND sendSett.type = '${sendType}'`,
      );
    }

    return await query.getOne();
  }

  @CatchError()
  async getActiveScheduleSettingByIdAndWorkspaceWithConfirmationAndReminderSetting(
    scheduleSettingId: number,
    workspaceId: string,
  ) {
    return await this.repo
      .createQueryBuilder('schSett')
      .where('schSett.active = true')
      .andWhere('schSett.workspace_id = :workspaceId', { workspaceId })
      .andWhere('schSett.id = :scheduleSettingId', { scheduleSettingId })
      .leftJoinAndMapMany(
        'schSett.confirmationSettings',
        ConfirmationSetting,
        'confSett',
        'confSett.active = true AND confSett.schedule_setting_id = schSett.id',
      )
      .leftJoinAndMapMany(
        'schSett.reminderSettings',
        ReminderSetting,
        'remSett',
        'remSett.active = true AND remSett.schedule_setting_id = schSett.id',
      )
      .leftJoinAndMapMany(
        'schSett.sendSettings',
        SendSetting,
        'sendSett',
        'sendSett.active = true AND sendSett.schedule_setting_id = schSett.id',
      )
      .getOne();
  }

  @CatchError()
  async getActiveScheduleSettingByIdAndWorkspace(
    scheduleSettingId: number,
    workspaceId: string,
  ) {
    return await this.repo.findOne({
      where: {
        active: true,
        id: scheduleSettingId,
        workspaceId,
      },
    });
  }

  @CatchError()
  async getActiveScheduleSettingById(scheduleSettingId: number) {
    return await this.repo.findOne({
      where: {
        active: true,
        id: scheduleSettingId,
      },
    });
  }

  @CatchError()
  async getScheduleSettingById(scheduleSettingId: number) {
    return await this.repo.findOne({
      where: {
        id: scheduleSettingId,
      },
    });
  }

  @CatchError()
  async createScheduleSetting(data: CreateScheduleSettingData) {
    const existsScheduleSetting = await this.repo.findOne({
      where: {
        workspaceId: data.workspaceId,
      },
    });
    if (existsScheduleSetting) {
      throw new CustomBadRequestException('Schedule setting exists');
    }
    return await this.repo.save({
      active: true,
      getScheduleInterval: Number(data.getScheduleInterval),
      integrationId: data.integrationId,
      workspaceId: data.workspaceId,
      useSpecialityOnExamMessage: data.useSpecialityOnExamMessage,
      sendOnlyPrincipalExam: data.sendOnlyPrincipalExam,
      name: data.name,
      extractRule: data.extractRule,
      extractAt: data.extractAt,
      enableSendRetry: data.enableSendRetry,
      enableResendNotAnswered: data.enableResendNotAnswered,
      useOrganizationUnitOnGroupDescription:
        data.useOrganizationUnitOnGroupDescription,
      omitAppointmentTypeName: data.omitAppointmentTypeName,
      omitExtractGuidance: data.omitExtractGuidance,
      fridayJoinWeekendMonday: data.fridayJoinWeekendMonday,
      checkScheduleChanges: data.checkScheduleChanges,
      omitTimeOnGroupDescription: data.omitTimeOnGroupDescription,
      useIsFirstComeFirstServedAsTime: data.useIsFirstComeFirstServedAsTime,
      timeResendNotAnswered: data.timeResendNotAnswered,
      useSendFullDay: data.useSendFullDay,
      externalExtract: !!data.externalExtract,
      apiKey: v4(),
    });
  }

  @CatchError()
  async updateScheduleSetting(data: UpdateScheduleSettingData) {
    return await this.repo.update(
      {
        id: data.id,
        workspaceId: data.workspaceId,
      },
      {
        active: data.active,
        name: data.name,
        getScheduleInterval: Number(data.getScheduleInterval),
        integrationId: data.integrationId,
        extractRule: data.extractRule,
        extractAt: data.extractAt,
        useSpecialityOnExamMessage: data.useSpecialityOnExamMessage,
        sendOnlyPrincipalExam: data.sendOnlyPrincipalExam,
        enableSendRetry: data.enableSendRetry,
        enableResendNotAnswered: data.enableResendNotAnswered,
        useOrganizationUnitOnGroupDescription:
          data.useOrganizationUnitOnGroupDescription,
        omitAppointmentTypeName: data.omitAppointmentTypeName,
        omitExtractGuidance: data.omitExtractGuidance,
        fridayJoinWeekendMonday: data.fridayJoinWeekendMonday,
        checkScheduleChanges: data.checkScheduleChanges,
        omitTimeOnGroupDescription: data.omitTimeOnGroupDescription,
        useIsFirstComeFirstServedAsTime: data.useIsFirstComeFirstServedAsTime,
        timeResendNotAnswered: data.timeResendNotAnswered,
        useSendFullDay: data.useSendFullDay,
        externalExtract: !!data.externalExtract,
      },
    );
  }

  @CatchError()
  async listByWorkspaceId(workspaceId: string) {
    return await this.repo.find({
      where: {
        workspaceId,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  @CatchError()
  async getOneByApiKey(apiKey: string) {
    return await this.repo.findOne({
      where: {
        apiKey,
      },
    });
  }

  @CatchError()
  async getOneById(id: number) {
    return await this.repo.findOne({
      where: {
        id,
      },
    });
  }

  @CatchError()
  async getScheduleSettingByIdAndWorkspaceWithSendSetting(
    workspaceId: string,
    scheduleSettingId: number,
  ) {
    return await this.repo
      .createQueryBuilder('schSett')
      .andWhere('schSett.workspace_id = :workspaceId', { workspaceId })
      .andWhere('schSett.id = :scheduleSettingId', { scheduleSettingId })
      .leftJoinAndMapOne(
        'schSett.confirmationSettings',
        ConfirmationSetting,
        'confSett',
        'confSett.schedule_setting_id = schSett.id',
      )
      .leftJoinAndMapOne(
        'schSett.reminderSettings',
        ReminderSetting,
        'remSett',
        'remSett.schedule_setting_id = schSett.id',
      )
      .leftJoinAndMapMany(
        'schSett.sendSettings',
        SendSetting,
        'sendSett',
        'sendSett.schedule_setting_id = schSett.id',
      )
      .getOne();
  }

  @CatchError()
  async createScheduleSettingAndVinculedSettings(
    workspaceId: string,
    data: {
      schedule: CreateScheduleSettingData;
      confirmation: CreateConfirmationSettingData;
      reminder: CreateReminderSettingData;
      sendSettings?: CreateSendSettingData[];
    },
  ) {
    const schedule = await this.repo.save({
      active: data.schedule.active,
      name: data.schedule.name,
      getScheduleInterval: Number(data.schedule.getScheduleInterval),
      integrationId: data.schedule.integrationId,
      workspaceId: workspaceId,
      apiKey: v4(),
      extractRule: data.schedule.extractRule,
      extractAt: data.schedule.extractAt,
      useSpecialityOnExamMessage: data.schedule.useSpecialityOnExamMessage,
      sendOnlyPrincipalExam: data.schedule.sendOnlyPrincipalExam,
      enableSendRetry: data.schedule.enableSendRetry,
      enableResendNotAnswered: data.schedule.enableResendNotAnswered,
      useOrganizationUnitOnGroupDescription:
        data.schedule.useOrganizationUnitOnGroupDescription,
      omitAppointmentTypeName: data.schedule.omitAppointmentTypeName,
      omitExtractGuidance: data.schedule.omitExtractGuidance,
      fridayJoinWeekendMonday: data.schedule.fridayJoinWeekendMonday,
      checkScheduleChanges: data.schedule.checkScheduleChanges,
      omitTimeOnGroupDescription: data.schedule.omitTimeOnGroupDescription,
      useIsFirstComeFirstServedAsTime:
        data.schedule.useIsFirstComeFirstServedAsTime,
      timeResendNotAnswered: data.schedule.timeResendNotAnswered,
      useSendFullDay: data.schedule.useSendFullDay,
      externalExtract: !!data.schedule.externalExtract,
    });

    const confirmation =
      await this.confirmationSettingService.createConfirmationSetting({
        ...data.confirmation,
        workspaceId,
        scheduleSettingId: schedule.id,
      });

    const reminder = await this.reminderSettingService.createReminderSetting({
      ...data.reminder,
      workspaceId,
      scheduleSettingId: schedule.id,
    });

    let sendSettings = [];
    if (data?.sendSettings?.length) {
      sendSettings = await Promise.all(
        data.sendSettings.map(async (sendSett) => {
          return await this.sendSettingService.createSendSetting({
            ...sendSett,
            scheduleSettingId: schedule.id,
          });
        }),
      );
    }

    return { schedule, confirmation, reminder, sendSettings };
  }

  @CatchError()
  async updateScheduleSettingAndVinculedSettings(
    workspaceId: string,
    scheduleSettingId: number,
    data: {
      schedule: UpdateScheduleSettingData;
      confirmation: UpdateConfirmationSettingData;
      reminder: UpdateReminderSettingData;
      sendSettings?: UpdateSendSettingData[];
    },
  ) {
    const schedule = await this.updateScheduleSetting({
      ...data.schedule,
      id: scheduleSettingId,
    });

    let confirmation;

    if (data.confirmation?.id) {
      confirmation =
        await this.confirmationSettingService.updateConfirmationSetting({
          ...data.confirmation,
          workspaceId,
        });
    } else {
      confirmation =
        await this.confirmationSettingService.createConfirmationSetting({
          ...data.confirmation,
          workspaceId,
          scheduleSettingId: scheduleSettingId,
        });
    }

    let reminder;

    if (data.reminder?.id) {
      reminder = await this.reminderSettingService.updateReminderSetting({
        ...data.reminder,
        workspaceId,
      });
    } else {
      reminder = await this.reminderSettingService.createReminderSetting({
        ...data.reminder,
        workspaceId,
        scheduleSettingId: scheduleSettingId,
      });
    }

    let sendSettings = [];
    if (data?.sendSettings?.length) {
      sendSettings = await Promise.all(
        data.sendSettings.map(async (sendSett) => {
          if (sendSett?.id) {
            return await this.sendSettingService.updateSendSetting({
              ...sendSett,
              workspaceId,
            });
          } else {
            return await this.sendSettingService.createSendSetting({
              ...sendSett,
              workspaceId,
              scheduleSettingId: scheduleSettingId,
            });
          }
        }),
      );
    }

    return { schedule, confirmation, reminder, sendSettings };
  }

  async checkScheduleTemplateUsage(workspaceId: string, templateId: string) {
    const results = await Promise.all([
      this.confirmationSettingService.checkTemplateUsage(
        workspaceId,
        templateId,
      ),
      this.reminderSettingService.checkTemplateUsage(workspaceId, templateId),
      this.sendSettingService.checkTemplateUsage(workspaceId, templateId),
    ]);

    return !!results[0] || !!results[1] || !!results[2];
  }
}
