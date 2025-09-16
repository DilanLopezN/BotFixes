import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { SCHEDULE_CONNECTION_NAME } from '../../connName';
import { Schedule } from '../../models/schedule.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfirmationSettingService } from '../confirmation/confirmation-setting.service';
import { ScheduleSettingService } from './schedule-setting.service';
import {
  RecipientType,
  ScheduleMessage,
  ScheduleMessageResponseType,
  ScheduleMessageState,
} from '../../models/schedule-message.entity';
import { ScheduleMessageService } from '../schedule-message/schedule-message.service';
import { ExtractResumeType } from '../../models/extract-resume.entity';
import { CreateScheduleAndScheduleMessageData } from '../../interfaces/create-schedule-and-send-message-data.interface';
import { ReminderSettingService } from '../reminder/reminder-setting.service';
import { SendScheduleMessageSetting } from '../../interfaces/send-schedule-message-data.interface';
import { ScheduleFilterListData } from '../../interfaces/schedule-filter-list-data.interface';
import { ExternalDataService } from '../external-data.service';
import { SendSettingService } from '../send-settings/send-setting.service';
import { ConfirmationSetting } from '../../models/confirmation-setting.entity';
import { SendSetting } from '../../models/send-setting.entity';
import { ResultScheduleWithSendSetting } from '../../schedule-analytics/interfaces/schedule-with-send-setting';
import { CancelReasonService } from '../cancel-reason/cancel-reason.service';
import { CatchError } from '../../../miscellaneous/exceptions';
import { ParseExtractTypeToActiveMessageInternalActions } from '../../../miscellaneous/ParseExtractTypeToActiveMessageInternalActions';
import { isValidEmail, isValidPhone } from '../../../miscellaneous/utils';
import * as Sentry from '@sentry/node';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule, SCHEDULE_CONNECTION_NAME)
    private repository: Repository<Schedule>,
    private readonly confirmationSettingService: ConfirmationSettingService,
    private readonly reminderSettingService: ReminderSettingService,
    private readonly scheduleSettingService: ScheduleSettingService,
    @Inject(forwardRef(() => ScheduleMessageService))
    private readonly scheduleMessageService: ScheduleMessageService,
    private readonly externalDataService: ExternalDataService,
    private readonly sendSettingService: SendSettingService,
    private readonly cancelReasonService: CancelReasonService,
  ) {}

  async createSchedule(schedule: Schedule) {
    return await this.repository.save(schedule);
  }

  async getOrCreateSchedule(data: CreateScheduleAndScheduleMessageData) {
    const { apiKey, schedule } = data;

    const scheduleSetting =
      await this.scheduleSettingService.getOneByApiKey(apiKey);
    if (!scheduleSetting) {
      throw new BadRequestException(
        'Cannot send confirmation, invalid api key',
      );
    }
    let patientSchedule = await this.repository.findOne({
      where: {
        patientCode: schedule.patientCode,
        workspaceId: schedule.workspaceId,
        integrationId: schedule.integrationId,
        scheduleCode: schedule.scheduleCode,
        scheduleDate: new Date(schedule.scheduleDate),
      },
    });

    if (!patientSchedule) {
      patientSchedule = await this.createSchedule({
        ...schedule,
        scheduleSettingId: scheduleSetting.id,
        integrationId: scheduleSetting.integrationId,
        workspaceId: scheduleSetting.workspaceId,
        scheduleDate: new Date(schedule.scheduleDate),
        createdAt: new Date(),
      } as Schedule);
    }

    try {
      patientSchedule.data = {
        ...(patientSchedule?.data || {}),
        ...(data?.schedule?.data || {}),
      };
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleService.name}.getOrCreateSchedule`,
        extra: {
          error: e,
        },
      });
    }
    return patientSchedule;
  }

  async createScheduleAndScheduleMessage(
    data: CreateScheduleAndScheduleMessageData,
  ) {
    const patientSchedule = await this.getOrCreateSchedule(data);
    const {
      schedule,
      settingTypeId,
      extractResumeType,
      sendRecipientType,
      sendingGroupType,
    } = data;
    try {
      if (
        !!patientSchedule?.groupId &&
        !!schedule?.groupId &&
        schedule.groupId !== patientSchedule.groupId
      ) {
        const scheduleMessagesIndividualCancel =
          await this.scheduleMessageService.getScheduleMessagesByGroupIdAndIndividualCancel(
            patientSchedule.groupId,
          );
        if (scheduleMessagesIndividualCancel) {
          await this.scheduleMessageService.createIfNotExistsScheduleMessage({
            sendType: extractResumeType,
            recipient: schedule.patientPhone,
            recipientType: sendRecipientType,
            scheduleId: patientSchedule.id,
            workspaceId: schedule.workspaceId,
            settingTypeId,
            sendingGroupType: sendingGroupType,
            groupId: patientSchedule.groupId,
            responseType:
              ScheduleMessageResponseType.individual_cancel_not_completed,
            state: ScheduleMessageState.INDIVIDUAL_CANCEL_NOT_COMPLETED,
          });
          return false;
        }
      }
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleService.name}.createScheduleAndScheduleMessage - INDIVIDUAL_CANCEL_NOT_COMPLETED`,
        extra: {
          error: e,
        },
      });
    }

    if (
      (!data.phoneList.length &&
        sendRecipientType === RecipientType.whatsapp) ||
      (!data.emailList.length && sendRecipientType === RecipientType.email)
    ) {
      await this.scheduleMessageService.createIfNotExistsScheduleMessage({
        sendType: extractResumeType,
        recipient: null,
        recipientType: sendRecipientType,
        scheduleId: patientSchedule.id,
        workspaceId: schedule.workspaceId,
        settingTypeId,
        sendingGroupType: sendingGroupType,
        groupId: schedule.groupId,
        responseType: ScheduleMessageResponseType.no_recipient,
        state: ScheduleMessageState.NO_RECIPIENT,
      });
      return false;
    }

    let validPhones = [];
    let validEmails = [];
    if (data.phoneList.length && sendRecipientType === RecipientType.whatsapp) {
      for (const phone of data.phoneList) {
        if (!isValidPhone(phone)) {
          await this.scheduleMessageService.createIfNotExistsScheduleMessage({
            sendType: extractResumeType,
            recipient: phone,
            recipientType: sendRecipientType,
            scheduleId: patientSchedule.id,
            workspaceId: schedule.workspaceId,
            settingTypeId,
            sendingGroupType: sendingGroupType,
            groupId: schedule.groupId,
            responseType: ScheduleMessageResponseType.invalid_recipient,
            state: ScheduleMessageState.NO_RECIPIENT,
          });
        } else {
          validPhones.push(phone);
        }
      }
    }
    if (data.emailList.length && sendRecipientType === RecipientType.email) {
      for (const email of data.emailList) {
        if (!isValidEmail(email)) {
          await this.scheduleMessageService.createIfNotExistsScheduleMessage({
            sendType: extractResumeType,
            recipient: email,
            recipientType: sendRecipientType,
            scheduleId: patientSchedule.id,
            workspaceId: schedule.workspaceId,
            settingTypeId,
            sendingGroupType: sendingGroupType,
            groupId: schedule.groupId,
            responseType: ScheduleMessageResponseType.invalid_recipient,
            state: ScheduleMessageState.NO_RECIPIENT,
          });
        } else {
          validEmails.push(email);
        }
      }
    }

    data.phoneList = validPhones;
    data.emailList = validEmails;

    return await this.createScheduleAndScheduleMessageSend({
      ...data,
      schedule: patientSchedule,
    });
  }

  private async createScheduleAndScheduleMessageSend(
    data: CreateScheduleAndScheduleMessageData,
  ) {
    const {
      schedule,
      emailList,
      phoneList,
      settingTypeId,
      extractResumeType,
      sendingGroupType,
    } = data;
    const sendScheduleMessageSetting: SendScheduleMessageSetting =
      await this.getSendScheduleMessageSetting(
        extractResumeType,
        settingTypeId,
      );

    if (sendScheduleMessageSetting) {
      const scheduleMessageList: ScheduleMessage[] = [];
      for (const phone of phoneList) {
        if (phone) {
          scheduleMessageList.push({
            sendType: extractResumeType,
            recipient: phone,
            recipientType: RecipientType.whatsapp,
            scheduleId: schedule.id,
            workspaceId: schedule.workspaceId,
            settingTypeId,
            sendingGroupType,
            groupId: schedule.groupId,
          });
        }
      }
      for (const email of emailList) {
        if (email) {
          scheduleMessageList.push({
            sendType: extractResumeType,
            recipient: email,
            recipientType: RecipientType.email,
            scheduleId: schedule.id,
            workspaceId: schedule.workspaceId,
            settingTypeId,
            sendingGroupType,
            groupId: schedule.groupId,
          });
        }
      }
      return await this.scheduleMessageService.createBatchScheduleMessageAndSend(
        {
          // a interface sendScheduleMessageSetting é diferente da do confirmationSetting mas o confirmationSetting
          // tem as propriedades de sendScheduleMessageSetting por isso é compatível
          sendScheduleMessageSetting,
          schedule: schedule as Schedule,
          scheduleMessageList,
          action:
            ParseExtractTypeToActiveMessageInternalActions[extractResumeType],
          sendRecipientType: data.sendRecipientType,
          orderedGroup: data.orderedGroup,
        },
      );
    }
  }

  private async getSendScheduleMessageSetting(
    extractResumeType: ExtractResumeType,
    settingTypeId: number,
  ): Promise<SendScheduleMessageSetting> {
    switch (extractResumeType) {
      case ExtractResumeType.confirmation: {
        return await this.confirmationSettingService.getActiveConfirmationSettingById(
          settingTypeId,
        );
      }
      case ExtractResumeType.reminder: {
        return await this.reminderSettingService.getActiveReminderSettingById(
          settingTypeId,
        );
      }
      default: {
        return await this.sendSettingService.getActiveSendSettingByIdAndType(
          settingTypeId,
          extractResumeType,
        );
      }
    }
  }

  @CatchError()
  async listSchedules(
    pagination: { skip: number; limit: number },
    filter: ScheduleFilterListData,
  ) {
    try {
      const result =
        await this.scheduleMessageService.listScheduleMessagesWithSchedule(
          pagination,
          filter,
        );

      const { count, data, currentPage, nextPage } = result;

      const uuidList: string[] = data.reduce((prev, schMsg) => {
        if (!schMsg.conversationId) {
          return [...prev, schMsg.uuid];
        }
        return prev;
      }, []);

      // Pega do active message os conversations ids de acordo com o uuid dos scheduleMessages
      // Não trazemos por join, pois o typeorm não permite join em tabela que está em outro schema, que é o caso do activeMessage
      // Não populamos o scheduleMessage com o conversationId no momento do envio pois o modulo de activeMessage fica apenas ouvindo
      //   a fila para fazer o envio da mensagem e a criação de conversa é feita de maneira assincrona;
      const conversationIdObject =
        await this.externalDataService.getConversationIdByScheduleMessageUuidList(
          uuidList,
          filter.workspaceId,
        );

      const cancelReasons = await this.cancelReasonService.listByWorkspaceId(
        filter.workspaceId,
      );

      //Popula o conversationId com o que veio do modulo de activeMessage
      const scheduleList = data.map((schMsg) => {
        return {
          ...schMsg,
          conversationId:
            schMsg.conversationId || conversationIdObject[schMsg.uuid],
          sendType: schMsg.sendType,
          status: schMsg.responseType,
          recipientType: schMsg.recipientType,
          reasonId: schMsg.reasonId ? Number(schMsg.reasonId) : null,
          npsScore: schMsg.npsScore ? Number(schMsg.npsScore) : null,
          feedback: schMsg.npsScoreComment ? schMsg.npsScoreComment : null,
          cancelReason: cancelReasons.find(
            (cancelingReason) => cancelingReason.id == schMsg.reasonId,
          ),
          id: schMsg.id,
        };
      });

      return {
        count: count,
        data: scheduleList,
        currentPage: currentPage,
        nextPage: nextPage,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @CatchError()
  async getScheduleByScheduleId(
    workspaceId: string,
    scheduleId: string,
  ): Promise<ResultScheduleWithSendSetting> {
    const result = await this.repository
      .createQueryBuilder('sc')
      .where(`sc.schedule_id = '${scheduleId}'`)
      .andWhere(`sc.workspace_id = '${workspaceId}'`)
      .leftJoinAndMapOne(
        'sc.confirmationSetting',
        ConfirmationSetting,
        'ct',
        `sc.schedule_setting_id = ct.schedule_setting_id AND ct.resend_msg_no_match = true`,
      )
      .leftJoinAndMapOne(
        'sc.sendSetting',
        SendSetting,
        'sst',
        `sc.schedule_setting_id = sst.schedule_setting_id AND sst.type = '${ExtractResumeType.confirmation}' AND sst.resend_msg_no_match = true`,
      )
      .getOne();

    if (
      result &&
      (!!result?.confirmationSetting?.resendMsgNoMatch ||
        !!result?.sendSetting?.resendMsgNoMatch)
    ) {
      return result;
    }

    return null;
  }

  @CatchError()
  async getScheduleWithEmail(
    integrationId: string,
    scheduleId: string,
  ): Promise<Schedule> {
    const result = await this.repository
      .createQueryBuilder('sc')
      .where(`sc.schedule_id = '${scheduleId}'`)
      .andWhere(`sc.integration_id = '${integrationId}'`)
      .innerJoinAndMapOne(
        'sc.scheduleMessage',
        ScheduleMessage,
        'scMsg',
        `sc.id = scMsg.schedule_id AND scMsg.send_type = '${ExtractResumeType.confirmation}' AND scMsg.recipient_type = '${RecipientType.email}'`,
      )
      .getOne();

    if (result && !!result?.scheduleMessage) {
      return result;
    }

    return null;
  }

  @CatchError()
  async getSchedulesByGroupId(
    workspaceId: string,
    groupId: string,
  ): Promise<Schedule[]> {
    return await this.repository
      .createQueryBuilder('sc')
      .where(`sc.group_id = '${groupId}'`)
      .andWhere(`sc.workspace_id = '${workspaceId}'`)
      .orderBy('sc.schedule_date')
      .getMany();
  }
}
