import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SCHEDULE_CONNECTION_NAME } from '../../connName';
import { SendSetting } from '../../models/send-setting.entity';
import {
  CreateSendSettingData,
  UpdateSendSettingData,
} from '../../interfaces/send-setting-data.interface';
import { ExtractResumeType } from '../../models/extract-resume.entity';
import { CatchError } from '../../../miscellaneous/exceptions';

@Injectable()
export class SendSettingService {
  constructor(
    @InjectRepository(SendSetting, SCHEDULE_CONNECTION_NAME)
    private repository: Repository<SendSetting>,
  ) {}

  @CatchError()
  async getActiveSendSettingById(sendSettingId: number) {
    return await this.repository.findOne({
      where: {
        active: true,
        id: sendSettingId,
      },
    });
  }

  @CatchError()
  async getActiveSendSettingByIdAndType(
    sendSettingId: number,
    type: ExtractResumeType,
  ) {
    return await this.repository.findOne({
      where: {
        active: true,
        id: sendSettingId,
        type: type,
      },
    });
  }

  @CatchError()
  async createSendSetting(data: CreateSendSettingData) {
    return await this.repository.save({ ...data });
  }

  @CatchError()
  async updateSendSetting(data: UpdateSendSettingData) {
    return await this.repository.update(
      {
        id: data.id,
        workspaceId: data.workspaceId,
      },
      {
        active: data.active,
        hoursBeforeScheduleDate: Number(data.hoursBeforeScheduleDate),
        templateId: data.templateId,
        apiToken: data.apiToken,
        retryInvalid: data.retryInvalid,
        resendMsgNoMatch: data.resendMsgNoMatch,
        erpParams: data.erpParams,
        groupRule: data.groupRule,
        sendAction: data.sendAction,
        sendRecipientType: data.sendRecipientType,
        emailSendingSettingId: data.emailSendingSettingId,
        type: data.type,
        sendingGroupType: data.sendingGroupType,
      },
    );
  }

  @CatchError()
  async deleteSendSettingByIdAndWorkspaceId(workspaceId: string, id: number) {
    return await this.repository.delete({
      id: id,
      workspaceId: workspaceId,
      active: Not(true)
    });
  }

  @CatchError()
  async checkTemplateUsage(workspaceId: string, templateId: string) {
    const sendSetting = await this.repository.findOne({
      where: {
        workspaceId,
        templateId,
      },
    });

    return !!sendSetting;
  }
}
