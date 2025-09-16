import { Injectable, Logger } from '@nestjs/common';
import { SendScheduleDto } from '../../dto/external-send-active-schedule.dto';
import { ScheduleSettingService } from '../schedule/schedule-setting.service';
import * as Sentry from '@sentry/node';
import { CreateScheduleAndScheduleMessageData } from '../../interfaces/create-schedule-and-send-message-data.interface';
import { RecipientType } from '../../models/schedule-message.entity';
import { Schedule } from '../../models/schedule.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SendActiveScheduleIncomingData } from '../../models/send-active-schedule-data.entity';
import { SCHEDULE_CONNECTION_NAME } from '../../connName';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from '../../../cache/cache.service';
import { KafkaService } from '../../../kafka/kafka.service';
import { CatchError, Exceptions } from '../../../miscellaneous/exceptions';
import { getCompletePhone } from '../../../miscellaneous/utils';

export const sendActiveScheduleTopicName = `send_active_schedule`;

@Injectable()
export class SendActiveScheduleIncomingService {
  private readonly logger = new Logger(SendActiveScheduleIncomingService.name);
  private readonly RATE_LIMIT = 1000;

  constructor(
    @InjectRepository(SendActiveScheduleIncomingData, SCHEDULE_CONNECTION_NAME)
    private repo: Repository<SendActiveScheduleIncomingData>,
    private readonly cacheService: CacheService,
    private scheduleSettingService: ScheduleSettingService,
    private kafkaService: KafkaService,
  ) {}

  getTotalEnqueuedLastMinuteCacheKey(apiKey: string) {
    return `total_enqueued_last_minute_send_active_schedule:${apiKey}`;
  }

  async getWorkspaceId(data: SendScheduleDto) {
    const { apiKey } = data;
    const scheduleSetting =
      await this.scheduleSettingService.getOneByApiKey(
        apiKey,
      );
    
    if (!scheduleSetting)
      throw Exceptions.CANNOT_SEND_ACTIVE_SCHEDULE_NOT_ENABLED;

    return {
      workspaceId: scheduleSetting.workspaceId
    };
  }

  @CatchError()
  async enqueueSendActiveSchedule(data: SendScheduleDto) {
    const { apiKey, sendType, contact, schedule } = data;
    const scheduleSetting =
      await this.scheduleSettingService.getActiveScheduleSettingByApiKeyWithSendSetting(
        apiKey,
        sendType,
      );
    if (!scheduleSetting)
      throw Exceptions.CANNOT_SEND_ACTIVE_SCHEDULE_NOT_ENABLED;

    const client = this.cacheService.getClient();
    const key = this.getTotalEnqueuedLastMinuteCacheKey(data.apiKey);
    const currentCount = await client.incr(key);

    if (currentCount > this.RATE_LIMIT) {
      if (currentCount === this.RATE_LIMIT + 1) {
        Sentry.captureEvent({
          message: 'enqueueMessage EXCEPTION SPAM_SEND_MESSAGE_BY_API_KEY',
          extra: {
            data: data,
          },
        });
      }
      throw Exceptions.SPAM_SEND_MESSAGE_BY_API_KEY;
    } else {
      await client.expire(key, 60);
    }

    const maxSizeInBytes = 5000; // Limite de 5 KB
    if (JSON.stringify(schedule).length > maxSizeInBytes) {
      throw Exceptions.ERROR_SIZE_JSON_SCHEDULE;
    }
    if (JSON.stringify(contact).length > maxSizeInBytes) {
      throw Exceptions.ERROR_SIZE_JSON_CONTACT;
    }

    let createdData: SendActiveScheduleIncomingData;
    try {
      createdData = await this.repo.save({
        id: uuidv4(),
        workspaceId: scheduleSetting.workspaceId,
        apiKey,
        sendType,
        schedule,
        contact,
      });
    } catch (e) {
      this.logger.error('enqueueSendActiveSchedule');
      this.logger.error(e);
      Sentry.captureException(e);
      return null;
    }

    const sendSetting = scheduleSetting.sendSettings[0];

    const phone = contact?.phone?.[0]
      ? getCompletePhone(contact.phone[0])
      : null;
    const scheduleToCreate: Schedule = {
      scheduleSettingId: scheduleSetting.id,
      integrationId: scheduleSetting.integrationId,
      workspaceId: scheduleSetting.workspaceId,
      scheduleCode: schedule.scheduleCode,
      //ATENÇÃO: Campo scheduleId do schedule não é o mesmo do scheduleId do scheudle_message. na entidade schedule o scheduleId é o do integrations e na
      // entidade schedule_message é a referencia pra join do schedule.id.
      // Por enquanto esse campo não vai ser salvo pois os envios feitos por aqui nao possuem o schedule salvo no integrations.
      // scheduleId: String(schedule.scheduleId),
      principalScheduleCode: schedule.principalScheduleCode,
      isPrincipal: !!schedule.isPrincipal,
      isFirstComeFirstServed: schedule.isFirstComeFirstServed,
      scheduleDate: new Date(schedule.scheduleDate),
      patientPhone: phone,
      patientName: contact.name,
      patientCode: contact.code,
      organizationUnitAddress: schedule.organizationUnitAddress,
      organizationUnitName: schedule.organizationUnitName,
      organizationUnitCode: schedule.organizationUnitCode,
      procedureName: schedule.procedureName,
      procedureCode: schedule.procedureCode,
      doctorName: schedule.doctorName,
      doctorObservation: schedule.doctorObservation,
      doctorCode: schedule.doctorCode,
      specialityName: schedule.specialityName,
      specialityCode: schedule.specialityCode,
      appointmentTypeName: schedule.appointmentTypeName,
      appointmentTypeCode: schedule.appointmentTypeCode,
      createdAt: new Date(),
      patientEmail: contact?.email?.[0],
      extractResumeId: null,
      data: schedule.data,
    };
    const dataToCreateSchedule: CreateScheduleAndScheduleMessageData = {
      apiKey,
      emailList: [],
      extractResumeType: sendType,
      phoneList: [],
      schedule: scheduleToCreate,
      sendingGroupType: sendSetting.sendingGroupType,
      sendRecipientType: sendSetting.sendRecipientType,
      settingTypeId: sendSetting.id,
      orderedGroup: [data]
    };

    if (sendSetting.sendRecipientType === RecipientType.email) {
      dataToCreateSchedule.emailList = !!contact?.email?.length ? contact.email : [];
    } else {
      dataToCreateSchedule.phoneList = contact.phone;
    }

    this.enqueueScheduleKafka(
      dataToCreateSchedule,
      scheduleSetting.workspaceId,
    );

    return { requestId: createdData.id };
  }

  private enqueueScheduleKafka(
    data: CreateScheduleAndScheduleMessageData,
    workspaceId: string,
  ) {
    this.kafkaService.sendEvent(data, workspaceId, sendActiveScheduleTopicName);
  }
}
