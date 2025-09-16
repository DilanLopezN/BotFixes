import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SCHEDULE_CONNECTION_NAME } from '../../connName';
import { ReminderSetting } from '../../models/reminder-setting.entity';
import {
  CreateReminderSettingData,
  UpdateReminderSettingData,
} from '../../interfaces/reminder-setting-data.interface';
import { CatchError } from '../../../miscellaneous/exceptions';

@Injectable()
export class ReminderSettingService {
  constructor(
    @InjectRepository(ReminderSetting, SCHEDULE_CONNECTION_NAME)
    private repo: Repository<ReminderSetting>,
  ) {}

  @CatchError()
  async getActiveReminderSettingById(reminderSettingId: number) {
    return await this.repo.findOne({
      where: {
        active: true,
        id: reminderSettingId,
      },
    });
  }

  @CatchError()
  async createReminderSetting(data: CreateReminderSettingData) {
    return await this.repo.save({ ...data });
  }

  @CatchError()
  async updateReminderSetting(data: UpdateReminderSettingData) {
    return await this.repo.update(
      {
        id: data.id,
        workspaceId: data.workspaceId,
      },
      {
        active: data.active,
        sendBeforeScheduleDate: Number(data.sendBeforeScheduleDate),
        templateId: data.templateId,
        apiToken: data.apiToken,
        retryInvalid: data.retryInvalid,
        erpParams: data.erpParams,
        groupRule: data.groupRule,
        sendAction: data.sendAction,
        sendRecipientType: data.sendRecipientType,
        emailSendingSettingId: data.emailSendingSettingId,
        sendingGroupType: data.sendingGroupType,
      },
    );
  }

  @CatchError()
  async checkTemplateUsage(workspaceId: string, templateId: string) {
    const reminderSetting = await this.repo.findOne({
      where: {
        workspaceId,
        templateId,
      },
    });

    return !!reminderSetting;
  }
}
