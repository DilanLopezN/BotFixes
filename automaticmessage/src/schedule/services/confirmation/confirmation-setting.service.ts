import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SCHEDULE_CONNECTION_NAME } from '../../connName';
import { ConfirmationSetting } from '../../models/confirmation-setting.entity';
import {
  CreateConfirmationSettingData,
  UpdateConfirmationSettingData,
} from '../../interfaces/confirmation-setting-data.interface';
import { CatchError } from '../../../miscellaneous/exceptions';

@Injectable()
export class ConfirmationSettingService {
  constructor(
    @InjectRepository(ConfirmationSetting, SCHEDULE_CONNECTION_NAME)
    private repo: Repository<ConfirmationSetting>,
  ) {}

  @CatchError()
  async getActiveConfirmationSettingById(confirmationSettingId: number) {
    return await this.repo.findOne({
      where: {
        active: true,
        id: confirmationSettingId,
      },
    });
  }

  @CatchError()
  async listConfirmationSettingByWorkspaceId(workspaceId: string) {
    return await this.repo.find({
      where: {
        active: true,
        workspaceId,
      },
    });
  }

  @CatchError()
  async createConfirmationSetting(data: CreateConfirmationSettingData) {
    return this.repo.save({
      ...data,
    });
  }

  @CatchError()
  async updateConfirmationSetting(data: UpdateConfirmationSettingData) {
    return this.repo.update(
      {
        id: data.id,
        workspaceId: data.workspaceId,
      },
      {
        active: data.active,
        templateId: data.templateId,
        apiToken: data.apiToken,
        sendWhatsBeforeScheduleDate: Number(data.sendWhatsBeforeScheduleDate),
        retryInvalid: data.retryInvalid,
        resendMsgNoMatch: data.resendMsgNoMatch,
        erpParams: data.erpParams,
        groupRule: data.groupRule,
        sendRecipientType: data.sendRecipientType,
        emailSendingSettingId: data.emailSendingSettingId,
        sendingGroupType: data.sendingGroupType,
      },
    );
  }

  @CatchError()
  async checkTemplateUsage(workspaceId: string, templateId: string) {
    const confirmationSetting = await this.repo.findOne({
      where: {
        workspaceId,
        templateId,
      },
    });

    return !!confirmationSetting;
  }
}
