import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  RecipientType,
  ScheduleMessage,
  ScheduleMessageResponseType,
  ScheduleMessageState,
} from '../../models/schedule-message.entity';
import {
  SCHEDULE_CONNECTION_NAME,
  SCHEDULE_READ_CONNECTION_NAME,
} from '../../connName';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { v4 } from 'uuid';
import * as Sentry from '@sentry/node';
import * as moment from 'dayjs';
import {
  ActivityType,
  ChannelIdConfig,
  IActiveMessageStatusChangedEvent,
  IdentityType,
} from 'kissbot-core';
import { SendScheduleMessageService } from './send-schedule-message.service';
import { Schedule } from '../../models/schedule.entity';
import { CreateBatchScheduleMessageAndSendData } from '../../interfaces/create-batch-schedule-message-send-data.interface';
import { ScheduleSettingService } from '../schedule/schedule-setting.service';
import { IntegrationApiService } from '../integration-api.service';
import {
  ExtractResume,
  ExtractResumeType,
} from '../../models/extract-resume.entity';
import { ConfirmationSettingService } from '../confirmation/confirmation-setting.service';
import { ReminderSettingService } from '../reminder/reminder-setting.service';
import { transformExtractResumeTypeToActiveMessageAction } from '../../utils';
import { SendScheduleMessageSetting } from '../../interfaces/send-schedule-message-data.interface';
import { ScheduleSetting } from '../../models/schedule-setting.entity';
import { SendSettingService } from '../send-settings/send-setting.service';
import { ScheduleFilterListData } from '../../interfaces/schedule-filter-list-data.interface';
import { ExternalDataService } from '../external-data.service';
import { isArray } from 'lodash';
import { feedbackEnum, StatusScheduleEnum } from '../../dto/schedule-query.dto';
import { ScheduleService } from '../schedule/schedule.service';
import { CacheService } from '../../../cache/cache.service';
import { CatchError } from '../../../miscellaneous/exceptions';
import { ParseExtractTypeToActiveMessageInternalActions } from '../../../miscellaneous/ParseExtractTypeToActiveMessageInternalActions';

@Injectable()
export class ScheduleMessageService {
  private readonly logger = new Logger(ScheduleMessageService.name);

  constructor(
    @InjectRepository(ScheduleMessage, SCHEDULE_CONNECTION_NAME)
    private repo: Repository<ScheduleMessage>,
    @InjectRepository(ScheduleMessage, SCHEDULE_READ_CONNECTION_NAME)
    private readRepo: Repository<ScheduleMessage>,
    private readonly sendScheduleMessage: SendScheduleMessageService,
    private readonly scheduleSettingService: ScheduleSettingService,
    private readonly integrationApiService: IntegrationApiService,
    private readonly confirmationSettingService: ConfirmationSettingService,
    private readonly reminderSettingService: ReminderSettingService,
    private readonly sendSettingService: SendSettingService,
    private readonly externalDataService: ExternalDataService,
    @Inject(forwardRef(() => ScheduleService))
    private readonly scheduleService: ScheduleService,
    public cacheService: CacheService,
  ) {}

  getResendOpenConversationCacheKey(conversationId: string) {
    return `RESEND_SCHEDULE_MSG_OPEN_CONVERSATION:${conversationId}`;
  }

  @CatchError()
  async createBatchScheduleMessageAndSend(
    data: CreateBatchScheduleMessageAndSendData,
  ): Promise<boolean> {
    try {
      const { scheduleMessageList, action } = data;
      const created: ScheduleMessage[] = [];

      for (const scheduleMessage of scheduleMessageList) {
        const createdSchedule =
          await this.createIfNotExistsScheduleMessage(scheduleMessage);
        if (
          createdSchedule &&
          createdSchedule.id &&
          typeof createdSchedule == 'object'
        ) {
          created.push(createdSchedule);
        }
      }
      const firstScheduleMessage = created.find(
        (msg) => msg.recipientType == data.sendRecipientType,
      );
      let sent = false;

      if (firstScheduleMessage) {
        const messageSent = await this.sendScheduleMessage.sendScheduleMessage({
          ...data,
          scheduleMessage: firstScheduleMessage,
          sendScheduleMessageSetting: data.sendScheduleMessageSetting,
          action,
        });

        if (messageSent) {
          await this.updateScheduleMessageEnqueuedAt(
            firstScheduleMessage.uuid,
            new Date(),
          );
          sent = true;
        }
      }

      return sent;
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.createBatchScheduleMessageAndSend`,
        extra: {
          error: e,
          data,
        },
      });
      return false;
    }
  }

  async createIfNotExistsScheduleMessage(scheduleMessage: ScheduleMessage) {
    let created = await this.repo.findOne({
      where: {
        scheduleId: scheduleMessage.scheduleId,
        sendType: scheduleMessage.sendType,
        recipient: scheduleMessage.recipient,
        recipientType: scheduleMessage.recipientType,
        sendingGroupType: scheduleMessage.sendingGroupType,
      },
    });

    //Se ja está criado tem que retornar nada para evitar envio duplicado
    if (created) {
      return;
    }

    // só retorna se foi criado no momento atual
    return await this.repo.save({
      ...scheduleMessage,
      uuid: v4(),
    });
  }

  async updateScheduleMessageConversationId(
    externalId: string,
    workspaceId: string,
    conversationId: string,
  ) {
    try {
      await this.repo
        .createQueryBuilder()
        .update(ScheduleMessage)
        .set({
          conversationId,
          sendedAt: new Date(),
          state: () => `
                    CASE WHEN
                        state = '${ScheduleMessageState.AWAITING_RESEND}'
                    THEN '${ScheduleMessageState.AWAITING_RESEND}'
                    ELSE '${ScheduleMessageState.AWAITING_RESPONSE}'
                    END
                `,
        })
        .where('uuid = :externalId', { externalId })
        .andWhere('workspace_id = :workspaceId', { workspaceId })
        .execute();
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageConversationId`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageAwaitingResend(
    externalId: string,
    conversationId: string,
  ) {
    try {
      await this.repo.update(
        {
          uuid: externalId,
        },
        {
          state: ScheduleMessageState.AWAITING_RESEND,
          responseType: ScheduleMessageResponseType.open_cvs,
        },
      );

      const resendCacheKey =
        this.getResendOpenConversationCacheKey(conversationId);
      const client = this.cacheService.getClient();
      await client.set(resendCacheKey, externalId);
      await client.expire(resendCacheKey, 86400 * 4);
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageAwaitingResend`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageSent(externalId: string, sendedAt: string) {
    try {
      await this.repo.update(
        {
          uuid: externalId,
        },
        {
          state: ScheduleMessageState.SENT,
          sendedAt: moment(sendedAt).toDate(),
        },
      );
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageSent`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageTryedResend(externalId: string) {
    try {
      await this.repo.update(
        {
          uuid: externalId,
        },
        {
          state: ScheduleMessageState.TRYED_RESEND,
        },
      );
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageEnqueuedResended`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageReadAt(externalId: string, readAt: string) {
    try {
      await this.repo.update(
        {
          uuid: externalId,
        },
        {
          readAt: moment(readAt).toDate(),
        },
      );
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageReadAt`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageAnsweredAt(
    externalId: string,
    answeredAt: string,
  ) {
    try {
      await this.repo.update(
        {
          uuid: externalId,
        },
        {
          answeredAt: moment(answeredAt).toDate(),
        },
      );
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageAnsweredAt`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageReceivedAt(
    externalId: string,
    receivedAt: string,
  ) {
    try {
      await this.repo.update(
        {
          uuid: externalId,
        },
        {
          receivedAt: moment(receivedAt).toDate(),
        },
      );
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageReceivedAt`,
        extra: {
          error: e,
        },
      });
    }
  }

  async getScheduleMessageByUUID(externalId: string) {
    return await this.repo
      .createQueryBuilder('msg')
      .where('msg.uuid = :uuid', { uuid: externalId })
      .innerJoinAndMapOne(
        'msg.schedule',
        Schedule,
        'sche',
        `sche.id = msg.schedule_id`,
      )
      .leftJoinAndMapMany(
        'msg.scheduleGroupList',
        Schedule,
        'g',
        'g.group_id = sche.group_id',
      )
      .getOne();
  }

  async updateScheduleMessageResponseTypeByUUID(
    externalId: string,
    responseType: ScheduleMessageResponseType,
  ) {
    return await this.repo.update(
      {
        uuid: externalId,
      },
      {
        responseType,
      },
    );
  }

  async updateRescheduleConfirmation(externalId: string) {
    return await this.repo.update(
      {
        uuid: externalId,
      },
      {
        responseType: ScheduleMessageResponseType.confirm_reschedule,
        state: ScheduleMessageState.SAVED_INTEGRATIONS,
      },
    );
  }

  async updateConfirmationOnIntegrations(
    schMsg: ScheduleMessage,
    data: IActiveMessageStatusChangedEvent,
    responseType: ScheduleMessageResponseType,
  ) {
    const updateResult = await this.repo.update(
      {
        uuid: data.externalId,
      },
      {
        responseType,
        state: ScheduleMessageState.AWAITING_SAVE_INTEGRATIONS,
      },
    );
    if (
      responseType === ScheduleMessageResponseType.reschedule ||
      responseType === ScheduleMessageResponseType.individual_cancel
    ) {
      return;
    }
    if (updateResult?.affected > 0) {
      const scheduleSetting = await this.scheduleSettingService.getOneById(
        schMsg.schedule.scheduleSettingId,
      );
      if (scheduleSetting) {
        await this.saveOnIntegrationsGroup(
          schMsg,
          scheduleSetting,
          responseType,
          data.conversationId,
        );
      } else {
        Sentry.captureEvent({
          message: `${ScheduleMessageService.name}.updateScheduleMessageResponse not scheduleSetting`,
          extra: {
            schMsg,
            data,
          },
        });
      }
    } else {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageResponse not updateResult`,
        extra: {
          updateResult,
          data,
        },
      });
    }
  }

  async updateScheduleMessageInvalidNumber(externalId: string) {
    const schMsg = await this.getScheduleMessageByUUID(externalId);

    if (schMsg) {
      await this.repo.update(
        {
          uuid: externalId,
        },
        {
          responseType: ScheduleMessageResponseType.invalid_number,
        },
      );
      await this.runNextScheduleMessageInvalidNumber(schMsg);
    }
  }

  private async saveOnIntegrationsGroup(
    scheduleMessage: ScheduleMessage,
    scheduleSetting: ScheduleSetting,
    responseType: ScheduleMessageResponseType,
    conversationId: string,
  ) {
    let schedulesToConfirm: Array<Schedule> = [scheduleMessage.schedule];
    if (
      scheduleMessage?.scheduleGroupList &&
      scheduleMessage?.scheduleGroupList?.length
    ) {
      schedulesToConfirm = scheduleMessage?.scheduleGroupList;
    }
    let result;
    for (const schedule of schedulesToConfirm) {
      const sendScheduleMessageSetting =
        await this.getSendScheduleMessageSetting(scheduleMessage);

      if (responseType == ScheduleMessageResponseType.confirmed) {
        result = await this.integrationApiService.confirmAppointment(
          scheduleSetting.integrationId,
          schedule,
          sendScheduleMessageSetting.erpParams,
          conversationId,
          scheduleMessage.workspaceId,
        );
      }
      if (responseType == ScheduleMessageResponseType.canceled) {
        result = await this.integrationApiService.cancelAppointment(
          scheduleSetting.integrationId,
          schedule,
          sendScheduleMessageSetting.erpParams,
          conversationId,
          scheduleMessage.workspaceId,
        );
      }
    }
    if (result?.ok == true || result?.data?.ok == true) {
      await this.repo.update(
        {
          uuid: scheduleMessage.uuid,
        },
        {
          state: ScheduleMessageState.SAVED_INTEGRATIONS,
        },
      );
    } else {
      // Sentry.captureEvent({
      //     message: `${ScheduleMessageService.name}.updateScheduleMessageResponse not result`, extra: {
      //         result,
      //         responseType,
      //         scheduleMessage
      //     }
      // });
    }
  }

  private async getSendScheduleMessageSetting(
    schMsg: ScheduleMessage,
  ): Promise<SendScheduleMessageSetting> {
    let sendScheduleMessageSetting: SendScheduleMessageSetting;
    // let shouldRetry: boolean = false;
    switch (schMsg.sendType) {
      case ExtractResumeType.confirmation: {
        sendScheduleMessageSetting =
          await this.confirmationSettingService.getActiveConfirmationSettingById(
            schMsg.settingTypeId,
          );
        break;
      }
      case ExtractResumeType.reminder: {
        sendScheduleMessageSetting =
          await this.reminderSettingService.getActiveReminderSettingById(
            schMsg.settingTypeId,
          );
        break;
      }
      default: {
        sendScheduleMessageSetting =
          await this.sendSettingService.getActiveSendSettingByIdAndType(
            schMsg.settingTypeId,
            schMsg.sendType,
          );
        break;
      }
    }
    return sendScheduleMessageSetting;
  }

  private async updateScheduleMessageEnqueuedAt(
    externalId: string,
    enqueuedAt: Date,
  ) {
    try {
      await this.repo.update(
        {
          uuid: externalId,
        },
        {
          enqueuedAt: enqueuedAt,
          state: ScheduleMessageState.ENQUEUED_ACT_MSG,
        },
      );
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageEnqueuedAt`,
        extra: {
          error: e,
        },
      });
    }
  }

  private async runNextScheduleMessageInvalidNumber(schMsg: ScheduleMessage) {
    try {
      if (schMsg.settingTypeId) {
        const sendScheduleMessageSetting =
          await this.getSendScheduleMessageSetting(schMsg);
        let shouldRetry: boolean = !!sendScheduleMessageSetting?.retryInvalid;

        if (shouldRetry) {
          const retryableScheduleMessages = await this.repo
            .createQueryBuilder('msg')
            .where('msg.response_type IS NULL')
            .andWhere('msg.sended_at IS NULL')
            .andWhere('msg.recipient_type = :recipientType', {
              recipientType: schMsg.recipientType,
            })
            .andWhere('msg.send_type = :sendType', {
              sendType: schMsg.sendType,
            })
            .andWhere('msg.group_id = :groupId', { groupId: schMsg.groupId })
            .andWhere('msg.workspace_id = :workspaceId', {
              workspaceId: schMsg.workspaceId,
            })
            .andWhere(`msg.created_at > (now() - interval '1 DAY')`)
            .getMany();

          if (retryableScheduleMessages?.length) {
            const scheduleMessage = retryableScheduleMessages[0];
            await this.sendScheduleMessage.sendScheduleMessage({
              action: transformExtractResumeTypeToActiveMessageAction(
                scheduleMessage.sendType,
              ),
              schedule: schMsg.schedule,
              scheduleMessage,
              sendScheduleMessageSetting,
            });
          }
        }
      }
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.runNextScheduleMessageInvalidNumber`,
        extra: {
          error: e,
        },
      });
    }
  }

  getQuery(filter: ScheduleFilterListData, orderBy?: boolean) {
    const momentStartDate = moment(filter.startDate)?.startOf('day');
    const momentEndDate = moment(filter.endDate)?.endOf('day');
    const searchString = filter?.search?.toLowerCase?.().trim?.();

    if (!isArray(filter.statusList)) {
      delete filter.statusList;
    }

    let query = this.readRepo.createQueryBuilder('schMsg');

    query
      .where(`schedule.schedule_date >= :startDate`, {
        startDate: momentStartDate.toISOString(),
      })
      .andWhere(`schedule.schedule_date <= :endDate`, {
        endDate: momentEndDate.toISOString(),
      })
      .andWhere(`schedule.workspace_id = :workspaceId`, {
        workspaceId: filter.workspaceId,
      })
      .andWhere(`schMsg.state NOT IN (:...state)`, {
        state: [
          ScheduleMessageState.AWAITING_SEND,
          ScheduleMessageState.TRYED_RESEND,
          ScheduleMessageState.RETRY_RESEND_CONFIRM_RSPNS,
          ScheduleMessageState.INDIVIDUAL_CANCEL_NOT_COMPLETED,
        ],
      });

    if (filter.getGroup) {
      query.andWhere(`schMsg.group_id IS NOT NULL`);
      query = query.innerJoin(
        Schedule,
        'schedule',
        `schedule.group_id = schMsg.group_id`,
      );
    } else {
      query = query.innerJoin(
        Schedule,
        'schedule',
        `schedule.id = schMsg.schedule_id`,
      );
    }

    query.select([
      // ScheduleMessage
      'schMsg.id AS "messageId"',
      'schMsg.uuid AS "uuid"',
      'schMsg.workspace_id AS "messageWorkspaceId"',
      'schMsg.conversation_id AS "conversationId"',
      'schMsg.group_id AS "messageGroupId"',
      'schMsg.schedule_id AS "scheduleId"',
      'schMsg.created_at AS "messageCreatedAt"',
      'schMsg.send_type AS "sendType"',
      'schMsg.setting_type_id AS "settingTypeId"',
      'schMsg.recipient AS "recipient"',
      'schMsg.recipient_type AS "recipientType"',
      'schMsg.state AS "state"',
      'schMsg.response_type AS "responseType"',
      'schMsg.sended_at AS "sendedAt"',
      'schMsg.enqueued_at AS "enqueuedAt"',
      'schMsg.response_at AS "responseAt"',
      'schMsg.received_at AS "receivedAt"',
      'schMsg.read_at AS "readAt"',
      'schMsg.answered_at AS "answeredAt"',
      'schMsg.reason_id AS "reasonId"',
      'schMsg.nps_score AS "npsScore"',
      'schMsg.nps_score_comment AS "npsScoreComment"',
      'schMsg.sending_group_type AS "sendingGroupType"',

      // Schedule
      'schedule.id AS "scheduleIdDb"',
      'schedule.schedule_setting_id AS "scheduleSettingId"',
      'schedule.extract_resume_id AS "extractResumeId"',
      'schedule.workspace_id AS "scheduleWorkspaceId"',
      'schedule.integration_id AS "integrationId"',
      'schedule.group_id AS "groupId"',
      'schedule.group_code_list AS "groupCodeList"',
      'schedule.group_id_list AS "groupIdList"',
      'schedule.group_count AS "groupCount"',
      'schedule.group_description AS "groupDescription"',
      'schedule.organization_unit_address AS "organizationUnitAddress"',
      'schedule.organization_unit_name AS "organizationUnitName"',
      'schedule.organization_unit_code AS "organizationUnitCode"',
      'schedule.procedure_name AS "procedureName"',
      'schedule.speciality_name AS "specialityName"',
      'schedule.speciality_code AS "specialityCode"',
      'schedule.procedure_code AS "procedureCode"',
      'schedule.doctor_observation AS "doctorObservation"',
      'schedule.doctor_name AS "doctorName"',
      'schedule.doctor_code AS "doctorCode"',
      'schedule.insurance_name AS "insuranceName"',
      'schedule.insurance_code AS "insuranceCode"',
      'schedule.insurance_plan_name AS "insurancePlanName"',
      'schedule.insurance_plan_code AS "insurancePlanCode"',
      'schedule.appointment_type_name AS "appointmentTypeName"',
      'schedule.appointment_type_code AS "appointmentTypeCode"',
      'schedule.schedule_code AS "scheduleCode"',
      'schedule.schedule_id AS "integrationScheduleId"',
      'schedule.principal_schedule_code AS "principalScheduleCode"',
      'schedule.is_principal AS "isPrincipal"',
      'schedule.is_first_come_first_served AS "isFirstComeFirstServed"',
      'schedule.schedule_date AS "scheduleDate"',
      'schedule.patient_phone AS "patientPhone"',
      'schedule.patient_email AS "patientEmail"',
      'schedule.patient_name AS "patientName"',
      'schedule.patient_code AS "patientCode"',
      'schedule.created_at AS "scheduleCreatedAt"',
      'schedule.data AS "data"',
    ]);

    if (orderBy) {
      query = query.orderBy('schedule.id', 'DESC');
    }

    if (!!searchString) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`schedule.schedule_code = :scheduleCode`, {
            scheduleCode: searchString,
          })
            .orWhere(`schedule.patient_code = :patientCode`, {
              patientCode: searchString,
            })
            .orWhere(
              `unaccent(schedule.patient_name) ILIKE unaccent(:patientName)`,
              {
                patientName: `%${searchString}%`,
              },
            );
        }),
      );
    }

    if (filter?.status && !filter?.statusList?.length) {
      query.andWhere(
        `${
          filter.status === 'not_answered'
            ? 'schMsg.response_type IS NULL'
            : `schMsg.response_type = '${filter.status}'`
        }`,
      );
    } else if (!!filter?.statusList?.length) {
      const statusContentNotAnswered = !!filter.statusList.find(
        (status) => status === StatusScheduleEnum.not_answered,
      );

      if (statusContentNotAnswered) {
        const statusList = filter.statusList.filter(
          (status) => status !== 'not_answered',
        );
        query.andWhere(
          new Brackets((qb) => {
            if (statusList?.length) {
              qb.where(`schMsg.response_type IN (:...statusList)`, {
                statusList: statusList,
              }).orWhere('schMsg.response_type IS NULL');
            } else {
              qb.where('schMsg.response_type IS NULL');
            }
          }),
        );
      } else {
        query.andWhere(`schMsg.response_type IN (:...statusList)`, {
          statusList: filter.statusList,
        });
      }
    }

    if (filter?.recipientType) {
      query.andWhere(`schMsg.recipient_type = :recipientType`, {
        recipientType: filter.recipientType,
      });
    }

    if (filter?.appointmentTypeCodeList?.length) {
      query.andWhere(
        `schedule.appointment_type_code IN (:...appointmentTypeCodeList)`,
        {
          appointmentTypeCodeList: filter.appointmentTypeCodeList,
        },
      );
    }

    if (filter?.doctorCodeList?.length) {
      query.andWhere(`schedule.doctor_code IN (:...doctorCodeList)`, {
        doctorCodeList: filter.doctorCodeList,
      });
    }

    if (filter?.procedureCodeList?.length) {
      query.andWhere(`schedule.procedure_code IN (:...procedureCodeList)`, {
        procedureCodeList: filter.procedureCodeList,
      });
    }

    if (filter?.specialityCodeList?.length) {
      query.andWhere(`schedule.speciality_code IN (:...specialityCodeList)`, {
        specialityCodeList: filter.specialityCodeList,
      });
    }

    if (filter?.insuranceCodeList?.length) {
      query.andWhere(`schedule.insurance_code IN (:...insuranceCodeList)`, {
        insuranceCodeList: filter.insuranceCodeList,
      });
    }

    if (filter?.insurancePlanCodeList?.length) {
      query.andWhere(
        `schedule.insurance_plan_code IN (:...insurancePlanCodeList)`,
        {
          insurancePlanCodeList: filter.insurancePlanCodeList,
        },
      );
    }

    if (filter?.organizationUnitList?.length) {
      query.andWhere(`schedule.organization_unit_code IN (:...unitCodeList)`, {
        unitCodeList: filter.organizationUnitList,
      });
    }

    if (filter?.patientCode && !searchString) {
      query.andWhere(`schedule.patient_code = :patientCode`, {
        patientCode: filter.patientCode,
      });
    }

    if (filter?.type) {
      query.andWhere(`schMsg.send_type = :sendType`, {
        sendType: filter.type,
      });
    }

    if (filter?.cancelReasonList?.length) {
      query.andWhere(`schMsg.reason_id IN (:...cancelReasonList)`, {
        cancelReasonList: filter.cancelReasonList,
      });
    }

    if (filter?.patientName?.trim() && !searchString) {
      query.andWhere(
        `unaccent(schedule.patient_name) ILIKE unaccent(:searchString)`,
        {
          searchString: `%${filter.patientName}%`,
        },
      );
    }

    if (filter?.scheduleCode && !searchString) {
      query.andWhere(`schedule.schedule_code = :scheduleCode`, {
        scheduleCode: filter.scheduleCode,
      });
    }

    if (filter?.npsScoreList?.length) {
      query.andWhere(`schMsg.nps_score IN (:...npsScoreList)`, {
        npsScoreList: filter.npsScoreList,
      });
    }

    if (filter?.feedback === feedbackEnum.withFeedback) {
      query = query.andWhere(`schMsg.nps_score_comment IS NOT NULL`);
      query = query.andWhere(`char_length(schMsg.nps_score_comment) > 0`);
    } else if (filter?.feedback === feedbackEnum.noFeedback) {
      query = query.andWhere(
        `(schMsg.nps_score_comment IS NULL OR schMsg.nps_score_comment = '')`,
      );
    }

    return query;
  }

  async listScheduleMessagesWithSchedule(
    pagination: { skip: number; limit: number },
    filter: ScheduleFilterListData,
  ) {
    try {
      let query = this.getQuery(filter, true);
      let countQuery = this.getQuery(filter, false);

      if (pagination.limit > 0) {
        query.take(pagination.limit);
      }
      let count = await countQuery
        .select('COUNT(*)', 'total')
        .getRawOne()
        .then((r) => parseInt(r.total, 10));
      let data = await query.skip(pagination.skip).getRawMany();

      const currentPage =
        pagination.skip && pagination.limit > 0
          ? Math.floor(pagination.skip / pagination.limit) + 1
          : 1;
      const nextPage =
        pagination.limit > 0 && currentPage * pagination.limit < count
          ? currentPage + 1
          : null;

      return {
        count,
        data,
        currentPage: currentPage,
        nextPage: nextPage,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async retrySaveIntegrations() {
    let retryed = 0;
    let retryCount = 0;
    try {
      const startDate = moment().subtract(1, 'day').startOf('day');
      const result = await this.readRepo
        .createQueryBuilder('schMsg')
        .where('schMsg.sended_at >= :sendedAt', {
          sendedAt: startDate.toISOString(),
        })
        .andWhere('schMsg.state = :state', {
          state: ScheduleMessageState.AWAITING_SAVE_INTEGRATIONS,
        })
        .andWhere('schMsg.send_type = :sendType', {
          sendType: ExtractResumeType.confirmation,
        })
        .andWhere('schMsg.response_type IN (:...responseType)', {
          responseType: [
            ScheduleMessageResponseType.canceled,
            ScheduleMessageResponseType.confirmed,
          ],
        })
        .innerJoinAndMapOne(
          'schMsg.schedule',
          Schedule,
          'sc',
          `sc.id = schMsg.schedule_id`,
        )
        .leftJoinAndMapMany(
          'schMsg.scheduleGroupList',
          Schedule,
          'sg',
          'sg.group_id = sc.group_id',
        )
        .getMany();
      retryCount = result.length;
      for (const schMsg of result) {
        try {
          const scheduleSetting = await this.scheduleSettingService.getOneById(
            schMsg.schedule.scheduleSettingId,
          );
          if (scheduleSetting) {
            await this.saveOnIntegrationsGroup(
              schMsg,
              scheduleSetting,
              schMsg.responseType,
              schMsg.conversationId,
            );
            retryed = retryed + 1;
          }
        } catch (e) {
          Sentry.captureEvent({
            message: `${ScheduleMessageService.name}.retrySaveIntegrations schMsg`,
            extra: {
              error: e,
              schMsg,
            },
          });
        }
      }
    } catch (e) {
      console.log('error', e);
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.retrySaveIntegrations query`,
        extra: {
          error: e,
        },
      });
    }
    this.logger.debug(`End retry count: ${retryCount}, retryed: ${retryed}`);
  }

  async resendOpenConversation(uuid: string) {
    try {
      const now = moment().utc().valueOf();
      const schMsg = await this.repo
        .createQueryBuilder('schMsg')
        .where('schMsg.uuid = :uuid', { uuid: uuid })
        .innerJoinAndMapOne(
          'schMsg.schedule',
          Schedule,
          'sc',
          `sc.id = schMsg.schedule_id`,
        )
        .leftJoinAndMapMany(
          'schMsg.scheduleGroupList',
          Schedule,
          'sg',
          'sg.group_id = sc.group_id',
        )
        .innerJoinAndMapOne(
          'schMsg.setting',
          ScheduleSetting,
          'st',
          `sc.schedule_setting_id = st.id AND st.enable_send_retry = true`,
        )
        .getOne();

      if (!schMsg) return;

      try {
        const scheduleDate = schMsg?.schedule?.scheduleDate;

        // Verifica se o horário de scheduleDate já está em UTC
        const isUtc = moment(scheduleDate).isSame(
          moment(scheduleDate).utc(),
          'minute',
        );

        const scheduleDateUtc = isUtc
          ? moment(scheduleDate).valueOf()
          : moment(scheduleDate).utc().valueOf();
        // se já passou da data do agendamento não deve enviar confirmação nem lembrete
        if (
          (schMsg?.sendType === ExtractResumeType.confirmation ||
            schMsg?.sendType === ExtractResumeType.reminder) &&
          scheduleDateUtc < now
        ) {
          return;
        }
      } catch (e) {
        if (
          (schMsg?.sendType === ExtractResumeType.confirmation ||
            schMsg?.sendType === ExtractResumeType.reminder) &&
          moment(schMsg?.schedule?.scheduleDate).valueOf() < now
        ) {
          return;
        }
      }
      try {
        const sendScheduleMessageSetting =
          await this.getSendScheduleMessageSetting(schMsg);

        try {
          if (schMsg?.setting?.checkScheduleChanges) {
            const sendScheduleMessageSetting =
              await this.getSendScheduleMessageSetting(schMsg);
            const canResendScheduleMessage = await this.checkScheduleChanges(
              schMsg.setting.integrationId,
              schMsg.schedule,
              sendScheduleMessageSetting.erpParams,
              schMsg.conversationId,
              schMsg.workspaceId,
            );

            if (!canResendScheduleMessage) {
              await this.updateScheduleMessageScheduleChanged(schMsg.id);
              return;
            }
          }
        } catch (e) {
          Sentry.captureEvent({
            message: `${ScheduleMessageService.name}.resendOpenConversation checkScheduleChanges`,
            extra: {
              error: e,
              schMsg,
            },
          });
        }

        const newScheduleMessage = await this.repo.save({
          uuid: v4(),
          sendType: schMsg.sendType,
          recipient: schMsg.recipient,
          recipientType: schMsg.recipientType,
          scheduleId: schMsg.scheduleId,
          workspaceId: schMsg.workspaceId,
          settingTypeId: schMsg.settingTypeId,
          groupId: schMsg.groupId,
        });
        const sended = await this.sendScheduleMessage.sendScheduleMessage({
          scheduleMessage: newScheduleMessage,
          schedule: schMsg.schedule,
          sendScheduleMessageSetting: sendScheduleMessageSetting,
          action:
            ParseExtractTypeToActiveMessageInternalActions[
              newScheduleMessage.sendType
            ],
        });
        if (sended) {
          await this.updateScheduleMessageTryedResend(schMsg.uuid);
        }
      } catch (e) {
        Sentry.captureEvent({
          message: `${ScheduleMessageService.name}.resendOpenConversation schMsg`,
          extra: {
            error: e,
            schMsg,
          },
        });
      }
    } catch (error) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.resendOpenConversation find scheduleMessage`,
        extra: {
          error: error,
        },
      });
    }
  }

  async resendMessageConfirmationNotAnswered() {
    const MIN_HOUR_TO_RESEND = 7; // começa o reenvio as 7h
    const MAX_HOUR_TO_RESEND = 22; // termina o reenvio as 22h
    const TIME_NOT_ANSWERED = 4; // tempo sem resposta
    const now = moment().valueOf();
    const startAtResend = moment()
      .startOf('day')
      .add(MIN_HOUR_TO_RESEND, 'hour')
      .valueOf();
    const endAtResend = moment()
      .startOf('day')
      .add(MAX_HOUR_TO_RESEND, 'hour')
      .valueOf();
    let resend = 0;
    let resendCount = 0;

    if (now < startAtResend || now > endAtResend) {
      return;
    }
    try {
      const result = await this.readRepo
        .createQueryBuilder('schMsg')
        .where(`schMsg.sended_at >= now() - interval '1 day'`)
        .andWhere(`schMsg.sended_at <= now()`)
        .andWhere('schMsg.state IN(:...state)', {
          state: [
            ScheduleMessageState.AWAITING_RESPONSE,
            ScheduleMessageState.RETRY_RESEND_CONFIRM_RSPNS,
          ],
        })
        .andWhere('schMsg.conversation_id IS NOT NULL')
        .innerJoinAndMapOne(
          'schMsg.schedule',
          Schedule,
          'sc',
          `sc.id = schMsg.schedule_id`,
        )
        .leftJoinAndMapMany(
          'schMsg.scheduleGroupList',
          Schedule,
          'sg',
          'sg.group_id = sc.group_id',
        )
        .innerJoinAndMapOne(
          'schMsg.setting',
          ScheduleSetting,
          'st',
          `sc.schedule_setting_id = st.id AND st.enable_resend_not_answered = true`,
        )
        .getMany();
      const listAwaitingResponse = result?.filter(
        (schMsg) => schMsg.state === ScheduleMessageState.AWAITING_RESPONSE,
      );
      resendCount = listAwaitingResponse.length;
      for (const schMsg of listAwaitingResponse) {
        try {
          try {
            if (schMsg?.setting?.checkScheduleChanges) {
              const sendScheduleMessageSetting =
                await this.getSendScheduleMessageSetting(schMsg);
              const canResendScheduleMessage = await this.checkScheduleChanges(
                schMsg.setting.integrationId,
                schMsg.schedule,
                sendScheduleMessageSetting.erpParams,
                schMsg.conversationId,
                schMsg.workspaceId,
              );

              if (!canResendScheduleMessage) {
                await this.updateScheduleMessageScheduleChanged(schMsg.id);
                continue;
              }
            }
          } catch (e) {
            Sentry.captureEvent({
              message: `${ScheduleMessageService.name}.resendMessageConfirmationNotAnswered checkScheduleChanges`,
              extra: {
                error: e,
                schMsg,
              },
            });
          }

          const resended = result.filter(
            (currSchMsg) =>
              currSchMsg.recipient === schMsg.recipient &&
              currSchMsg.sendType === schMsg.sendType &&
              currSchMsg.workspaceId === schMsg.workspaceId &&
              currSchMsg.state ===
                ScheduleMessageState.RETRY_RESEND_CONFIRM_RSPNS,
          );
          if (resended.length > 0) {
            resendCount = resendCount - 1;
            continue;
          }

          const maxTimeNotAnswered = moment(schMsg.sendedAt)
            .add(
              schMsg?.setting?.timeResendNotAnswered || TIME_NOT_ANSWERED,
              'hour',
            )
            .valueOf();
          // console.log('maxTimeNotAnswered: ', moment(maxTimeNotAnswered).format('DD/MM/yyyy HH:mm'))

          // se já foi criado o registro a mais de (tempo definido no scheduleSetting ou 4 horas) e não foi respondido deve mandar novamente a mesma mensagem
          if (maxTimeNotAnswered <= now) {
            const conversation =
              await this.externalDataService.getConversationById(
                schMsg.conversationId as string,
              );

            if (
              conversation &&
              conversation.state === 'open' &&
              conversation.createdByChannel == ChannelIdConfig.confirmation &&
              !conversation?.assignedToTeamId // se tem time assinado a conversa já foi assumida e não deve enviar
            ) {
              const sendScheduleMessageSetting =
                await this.getSendScheduleMessageSetting(schMsg);
              const template = await this.externalDataService.getTemplateById(
                sendScheduleMessageSetting.templateId,
              );

              if (template) {
                await this.repo.save({
                  uuid: v4(),
                  sendType: schMsg.sendType,
                  recipient: schMsg.recipient,
                  recipientType: schMsg.recipientType,
                  scheduleId: schMsg.scheduleId,
                  workspaceId: schMsg.workspaceId,
                  settingTypeId: schMsg.settingTypeId,
                  groupId: schMsg.groupId,
                  conversationId: schMsg.conversationId,
                  sendedAt: new Date(),
                  state: ScheduleMessageState.RETRY_RESEND_CONFIRM_RSPNS,
                });
                let systemMember = conversation.members.find(
                  (mem) => mem.type === IdentityType.system,
                );
                const attributes = await this.sendScheduleMessage.getAttributes(
                  schMsg.schedule,
                  schMsg.sendType,
                  sendScheduleMessageSetting.templateId,
                );

                const templateVariableValues: string[] = [];
                const variablesParse: { key: string; value: string }[] = [];
                template.variables.forEach((variable) => {
                  const attribute = attributes.find(
                    (attr) => attr.name === variable.value,
                  );
                  if (attribute) {
                    templateVariableValues.push(attribute.value);
                    variablesParse.push({
                      key: attribute.name,
                      value: attribute.value,
                    });
                  } else {
                    templateVariableValues.push(variable.value);
                    variablesParse.push({
                      key: variable.value,
                      value: variable.value,
                    });
                  }
                });

                const text = await this.externalDataService.getParsedTemplate(
                  template._id,
                  variablesParse,
                );

                const activity: any = {
                  type: ActivityType.message,
                  from: systemMember,
                  text: text || template.message,
                  conversationId: conversation._id,
                  templateId: template._id,
                  templateVariableValues: templateVariableValues,
                };
                const sended =
                  await this.externalDataService.dispatchMessageActivity(
                    conversation,
                    activity,
                  );
                if (sended) {
                  resend = resend + 1;
                }
              }
            }
          } else {
            resendCount = resendCount - 1;
          }
        } catch (e) {
          Sentry.captureEvent({
            message: `${ScheduleMessageService.name}.resendMessageConfirmationNotAnswered schMsg`,
            extra: {
              error: e,
              schMsg,
            },
          });
        }
      }
    } catch (e) {
      console.log('error', e);
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.resendMessageConfirmationNotAnswered query`,
        extra: {
          error: e,
        },
      });
    }
    this.logger.debug(
      `End resendMessageConfirmationNotAnswered count: ${resendCount}, resend: ${resend}`,
    );
  }

  async checkScheduleChanges(
    integrationId: string,
    schedule: Schedule,
    erpParams: string,
    conversationId: string,
    workspaceId: string,
  ) {
    const result = await this.integrationApiService.validateScheduleData(
      integrationId,
      schedule,
      erpParams,
      conversationId,
      workspaceId,
    );

    return !!result?.ok;
  }

  async updateScheduleMessageScheduleChanged(id: number) {
    try {
      await this.repo.update(
        {
          id: id,
        },
        {
          state: ScheduleMessageState.SCHEDULE_CHANGED,
        },
      );
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageScheduleChanged`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageCancelReason(
    workspaceId: string,
    scheduleId: number,
    reasonId: number,
  ) {
    try {
      const scheduleMsg = await this.repo
        .createQueryBuilder('msg')
        .where('msg.workspace_id = :workspaceId', { workspaceId })
        .innerJoinAndMapOne(
          'msg.schedule',
          Schedule,
          'sche',
          `sche.id = msg.schedule_id AND sche.schedule_id = :scheduleId`,
          { scheduleId },
        )
        .getOne();

      if (scheduleMsg) {
        await this.repo.update(
          {
            id: scheduleMsg.id,
          },
          {
            reasonId: reasonId,
          },
        );
      }
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageCancelReason`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageTypeEmail(
    integrationId: string,
    scheduleId: string,
    responseType: ScheduleMessageResponseType,
  ) {
    try {
      const schedule = await this.scheduleService.getScheduleWithEmail(
        integrationId,
        scheduleId,
      );
      const schMsg = schedule?.scheduleMessage;

      if (!schMsg) {
        return null;
      }

      return await this.repo.update(
        {
          id: schMsg.id,
        },
        {
          state: ScheduleMessageState.SAVED_INTEGRATIONS,
          responseAt: moment().toDate(),
          responseType: responseType,
        },
      );
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageTypeEmail`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageNpsScore(
    workspaceId: string,
    scheduleId: number,
    npsScore: number,
    externalId: string,
  ) {
    try {
      const queryBuilder = this.repo
        .createQueryBuilder('msg')
        .where('msg.workspace_id = :workspaceId', { workspaceId })
        .andWhere('msg.send_type = :sendType', {
          sendType: ExtractResumeType.nps_score,
        });

      if (externalId) {
        queryBuilder.andWhere('msg.uuid = :externalId', { externalId });
      }

      queryBuilder.innerJoinAndMapOne(
        'msg.schedule',
        Schedule,
        'sche',
        `sche.id = msg.schedule_id AND sche.schedule_id = :scheduleId`,
        { scheduleId },
      );

      const scheduleMsg = await queryBuilder.getOne();

      if (scheduleMsg) {
        await this.repo.update(
          {
            id: scheduleMsg.id,
          },
          {
            npsScore: npsScore,
          },
        );
      }
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageNpsScore`,
        extra: {
          error: e,
        },
      });
    }
  }

  async updateScheduleMessageNpsScoreComment(
    workspaceId: string,
    scheduleId: number,
    npsScoreComment: string,
    externalId: string,
  ) {
    try {
      const queryBuilder = this.repo
        .createQueryBuilder('msg')
        .where('msg.workspace_id = :workspaceId', { workspaceId })
        .andWhere('msg.send_type = :sendType', {
          sendType: ExtractResumeType.nps_score,
        });

      if (externalId) {
        queryBuilder.andWhere('msg.uuid = :externalId', { externalId });
      }

      queryBuilder.innerJoinAndMapOne(
        'msg.schedule',
        Schedule,
        'sche',
        `sche.id = msg.schedule_id AND sche.schedule_id = :scheduleId`,
        { scheduleId },
      );

      const scheduleMsg = await queryBuilder.getOne();

      if (scheduleMsg) {
        await this.repo.update(
          {
            id: scheduleMsg.id,
          },
          {
            npsScoreComment,
          },
        );
      }
    } catch (e) {
      Sentry.captureEvent({
        message: `${ScheduleMessageService.name}.updateScheduleMessageNpsScoreComment`,
        extra: {
          error: e,
        },
      });
    }
  }
  async getScheduleMessagesByGroupIdAndIndividualCancel(groupId: string) {
    return await this.readRepo.findOne({
      where: {
        groupId,
        responseType: ScheduleMessageResponseType.individual_cancel,
      },
    });
  }
}
