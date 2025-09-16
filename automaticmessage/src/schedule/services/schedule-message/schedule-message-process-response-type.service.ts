import { ScheduleMessageResponseType } from '../../models/schedule-message.entity';
import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { IActiveMessageStatusChangedEvent } from 'kissbot-core';
import { ExtractResumeType } from '../../models/extract-resume.entity';
import { ScheduleMessageService } from './schedule-message.service';

@Injectable()
export class ScheduleMessageProcessResponseTypeService {
  private readonly logger = new Logger(
    ScheduleMessageProcessResponseTypeService.name,
  );

  constructor(
    private readonly scheduleMessageService: ScheduleMessageService,
  ) {}

  async updateScheduleMessageResponse(data: IActiveMessageStatusChangedEvent) {
    let responseType: ScheduleMessageResponseType;

    switch (data.status) {
      case -1:
        await this.scheduleMessageService.updateScheduleMessageInvalidNumber(
          data.externalId,
        );
        break;
      case -2:
        // já existe uma conversa aberta e a flag de conversa aberta do active-message-setting está false
        await this.scheduleMessageService.updateScheduleMessageAwaitingResend(
          data.externalId,
          data.conversationId,
        );
        break;
      case -5:
        // -5 e -6 são os status code globais para cancelado e confirmado da aplicação, ver na tabela active_message.active_message_status
        responseType = ScheduleMessageResponseType.confirmed;
        break;
      case -6:
        responseType = ScheduleMessageResponseType.canceled;
        break;
      case -7:
        responseType = ScheduleMessageResponseType.reschedule;
        break;
      case -8:
        responseType = ScheduleMessageResponseType.individual_cancel;
        break;
      case -9:
        responseType = ScheduleMessageResponseType.start_reschedule_recover;
        break;
      case -10:
        responseType = ScheduleMessageResponseType.cancel_reschedule_recover;
        break;
      case -11:
        responseType = ScheduleMessageResponseType.confirm_reschedule_recover;
        break;
      case -12:
        await this.scheduleMessageService.updateRescheduleConfirmation(
          data.externalId,
        );
        break;
    }

    if (!responseType) {
      return;
    }

    try {
      const schMsg = await this.scheduleMessageService.getScheduleMessageByUUID(
        data.externalId,
      );

      if (schMsg && schMsg.schedule) {
        switch (schMsg.sendType) {
          case ExtractResumeType.confirmation:
            await this.scheduleMessageService.updateConfirmationOnIntegrations(
              schMsg,
              data,
              responseType,
            );
            break;

          case ExtractResumeType.recover_lost_schedule:
            await this.scheduleMessageService.updateScheduleMessageResponseTypeByUUID(
              data.externalId,
              responseType,
            );
            break;
        }
      }
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageResponse`,
        extra: {
          error: e,
        },
      });
    }
  }
}
