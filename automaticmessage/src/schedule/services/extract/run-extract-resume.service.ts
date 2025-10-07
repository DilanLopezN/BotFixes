import { Injectable, Logger } from '@nestjs/common';
import { ExtractResumeService } from './extract-resume.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduleSettingService } from '../schedule/schedule-setting.service';
import {
  ExtractResume,
  ExtractResumeState,
  ExtractResumeType,
} from '../../models/extract-resume.entity';
// import { CatchError, Exceptions } from '../../../auth/exceptions';
import { RunNextExtractData } from '../../interfaces/run-next-extarct-data.interface';
import { ExtractRule, ScheduleSetting } from '../../models/schedule-setting.entity';
import * as moment from 'dayjs';
import * as Sentry from '@sentry/node';
import { RunExtractData } from '../../interfaces/run-extract-data.interface';
import {
  IntegrationApiService,
  SendSchedule,
} from '../integration-api.service';
import { uniqBy, orderBy, groupBy } from 'lodash';
// import { getCompletePhone } from '../../../../common/utils/utils';
import { Schedule } from '../../models/schedule.entity';
import { ScheduleService } from '../schedule/schedule.service';
import { v4 } from 'uuid';
import { ScheduleGroupRule } from '../../interfaces/schedule-group-rule.enum';
// import { KafkaService } from '../../../_core/kafka/kafka.service';
// import { shouldRunCron } from '../../../../common/utils/bootstrapOptions';
import { RecipientType } from '../../models/schedule-message.entity';
import { CreateScheduleAndScheduleMessageData } from '../../interfaces/create-schedule-and-send-message-data.interface';
import { KafkaService } from '../../../kafka/kafka.service';
import { getCompletePhone, shouldRunCron } from '../../../miscellaneous/utils';
import { CatchError, Exceptions } from '../../../miscellaneous/exceptions';
var duration = require('dayjs/plugin/duration');

moment.extend(duration);

export const scheduleTopicName = `schedule_extract`;
@Injectable()
export class RunExtractResumeService {
  private readonly logger = new Logger(RunExtractResumeService.name);
  private readonly defaultExtractAt = 540;
  private readonly defaultGetScheduleInterval = 60;
  constructor(
    private readonly extractResumeService: ExtractResumeService,
    private scheduleSettingService: ScheduleSettingService,
    private readonly integrationApiService: IntegrationApiService,
    private readonly scheduleService: ScheduleService,
    private kafkaService: KafkaService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  private async extract() {
    if (!shouldRunCron()) return;
    try {
      const scheduleSettingList =
        await this.scheduleSettingService.getActiveScheduleSettings();
      for (const scheduleSetting of scheduleSettingList) {
        const reminderSettings = scheduleSetting.reminderSettings || [];
        for (const reminderSet of reminderSettings) {
          this.logger.log('running extract reminder extract');
          await this.runNextExtract({
            scheduleSetting,
            type: ExtractResumeType.reminder,
            hoursBeforeScheduleDate: reminderSet.sendBeforeScheduleDate || 12,
            settingTypeId: reminderSet.id,
            erpParams: reminderSet.erpParams,
            scheduleGroupRule: reminderSet.groupRule,
          });
        }
        const confirmationSettings = scheduleSetting.confirmationSettings || [];
        for (const confirmationSet of confirmationSettings) {
          this.logger.log('running extract confirmation extract');
          await this.runNextExtract({
            scheduleSetting,
            type: ExtractResumeType.confirmation,
            hoursBeforeScheduleDate:
              confirmationSet.sendWhatsBeforeScheduleDate || 24,
            settingTypeId: confirmationSet.id,
            erpParams: confirmationSet.erpParams,
            scheduleGroupRule: confirmationSet.groupRule,
          });
        }
        const sendSettings = scheduleSetting.sendSettings || [];
        for (const sendSet of sendSettings) {
          this.logger.log(`running extract ${sendSet.type} extract`);
          await this.runNextExtract({
            scheduleSetting,
            type: sendSet.type,
            hoursBeforeScheduleDate: sendSet.hoursBeforeScheduleDate || 24,
            settingTypeId: sendSet.id,
            erpParams: sendSet.erpParams,
            scheduleGroupRule: sendSet.groupRule,
          });
        }
      }
    } catch (e) {
      console.log(e);
      Sentry.captureEvent({
        message: `${ExtractResumeService.name}.extract`,
        extra: {
          error: e,
        },
      });
    }
  }

  @CatchError()
  async runNextExtract(runNextExtractData: RunNextExtractData) {
    const { scheduleSetting, extractRuleParam } = runNextExtractData;
    const extractRule: ExtractRule =
      extractRuleParam || scheduleSetting.extractRule;
    switch (extractRule) {
      case ExtractRule.DEFAULT: {
        return await this.runDefaultStrategy(runNextExtractData);
      }
      case ExtractRule.DAILY: {
        return await this.runDailyStrategy(runNextExtractData);
      }
      case ExtractRule.HOURLY: {
        return await this.runHourlyStrategy(runNextExtractData);
      }
      case ExtractRule.DAILYV2: {
        return await this.runDailyV2Strategy(runNextExtractData);
      }
      case ExtractRule.MANUAL: {
        return await this.runManualStrategy(runNextExtractData);
      }
      default: {
        return await this.runDefaultStrategy(runNextExtractData);
      }
    }
  }

  private getRecipientTypeAndSendingGroupType(data: RunNextExtractData): {
    sendRecipientType: RecipientType;
    sendingGroupType: string;
  } {
    let sendRecipientType = RecipientType.whatsapp;
    const DEFAUL_GROUP_TYPE = 'principal';
    let sendingGroupType = DEFAUL_GROUP_TYPE;

    switch (data.type) {
      case ExtractResumeType.confirmation:
        if (
          data?.scheduleSetting?.confirmationSettings?.[0]?.sendRecipientType
        ) {
          sendRecipientType =
            data.scheduleSetting.confirmationSettings?.[0].sendRecipientType;
          sendingGroupType =
            data.scheduleSetting.confirmationSettings?.[0].sendingGroupType;
        }
        break;
      case ExtractResumeType.reminder:
        if (data?.scheduleSetting?.reminderSettings?.[0]?.sendRecipientType) {
          sendRecipientType =
            data.scheduleSetting.reminderSettings?.[0].sendRecipientType;
          sendingGroupType =
            data.scheduleSetting.reminderSettings?.[0].sendingGroupType;
        }
        break;
      default:
        if (data?.scheduleSetting?.sendSettings?.[0]?.sendRecipientType) {
          sendRecipientType =
            data.scheduleSetting.sendSettings?.[0].sendRecipientType;
          sendingGroupType =
            data.scheduleSetting.sendSettings?.[0].sendingGroupType;
        }
        break;
    }
    return {
      sendRecipientType,
      sendingGroupType: sendingGroupType || DEFAUL_GROUP_TYPE,
    };
  }

  @CatchError()
  private async runDailyStrategy(data: RunNextExtractData) {
    const { scheduleSetting, hoursBeforeScheduleDate } = data;
    const now = moment();
    // If para rodar apenas depois do horário setado na configuração ou default 540 minutos(9h da manhã)
    if ((scheduleSetting.extractAt || 540) / 60 > now.get('hour')) {
      const omitMessage =
        'ommiting extract: runDailyStrategy not on hour, setting ' +
        (scheduleSetting.extractAt || 540);
      this.logger.debug(omitMessage);
      return omitMessage;
    }

    let startDate = now.clone().add(1, 'day').startOf('day');
    let endDate = now.clone().add(1, 'day').endOf('day');

    if (
      !hoursBeforeScheduleDate ||
      (hoursBeforeScheduleDate <= 24 && hoursBeforeScheduleDate > 12)
    ) {
      if (now.clone().day() == 0) {
        const omitMessage = 'ommiting extract: runDailyStrategy sunday';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
      if (now.clone().day() == 6) {
        const omitMessage = 'ommiting extract: runDailyStrategy saturday';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
      if (
        now.clone().day() == 5 &&
        (!hoursBeforeScheduleDate || hoursBeforeScheduleDate <= 24)
      ) {
        startDate = now.clone().add(1, 'day').startOf('day');
        endDate = now.clone().add(3, 'day').endOf('day');
      }
    } else if (hoursBeforeScheduleDate) {
      startDate = now
        .clone()
        .add(hoursBeforeScheduleDate, 'hour')
        .startOf('day');
      endDate = now.clone().add(hoursBeforeScheduleDate, 'hour').endOf('day');
    }

    if (now.clone().day() == 5 && scheduleSetting?.fridayJoinWeekendMonday) {
      startDate = now.clone().add(1, 'day').startOf('day');
      endDate = now.clone().add(3, 'day').endOf('day');
    }

    //Busca se existe um extract ja criado para o dia
    const existingExtract = await this.extractResumeService.getDailyExtracts({
      data,
      now,
      scheduleSetting,
    });

    if (
      existingExtract &&
      existingExtract?.state !== ExtractResumeState.ENDED_ERROR
    ) {
      // Valida se a extração ainda está sendo executada
      if (existingExtract?.state == ExtractResumeState.RUNNING) {
        const now = moment();
        const startedAt = moment(existingExtract.startedAt);
        var duration = moment.duration(now.diff(startedAt));
        var minutes = duration.asMinutes();
        //Se está a mais de 60 minutos rodando significa que está travado, tem que rodar novamente
        if (minutes >= 60) {
          await this.extractResumeService.updateEndedLock(existingExtract.id);
          existingExtract.state = ExtractResumeState.ENDED_LOCK;
        }
      } else {
        const omitMessage = 'ommiting extract: runDailyStrategy runner on day';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
    }
    const nextExtract: ExtractResume =
      await this.extractResumeService.createExtractResume({
        workspaceId: scheduleSetting.workspaceId,
        scheduleSettingId: scheduleSetting.id,
        createdAt: new Date(),
        extractRule: ExtractRule.DAILY,
        startRangeDate: startDate.clone().toDate(),
        endRangeDate: endDate.clone().toDate(),
        type: data.type,
        settingTypeId: data.settingTypeId,
        uuid: v4(),
      });

    const { sendRecipientType, sendingGroupType } =
      this.getRecipientTypeAndSendingGroupType(data);
    this.enqueueScheduleKafka({
      scheduleSetting,
      erpParams: data.erpParams,
      extract: nextExtract,
      startDate: moment(nextExtract.startRangeDate),
      endDate: moment(nextExtract.endRangeDate),
      scheduleGroupRule: data.scheduleGroupRule,
      sendRecipientType,
      sendingGroupType,
      hoursBeforeScheduleDate,
    });
  }

  @CatchError()
  private async runManualStrategy(data: RunNextExtractData) {
    const {
      scheduleSetting,
      extractEndDate,
      extractStartDate,
      hoursBeforeScheduleDate,
    } = data;
    const lastExtract =
      await this.extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
        {
          scheduleSettingId: scheduleSetting.id,
          type: data.type,
          settingTypeId: data.settingTypeId,
        },
      );
    //Valida se a extração ainda está sendo executada
    if (lastExtract?.state == ExtractResumeState.RUNNING) {
      const now = moment();
      const startedAt = moment(lastExtract.startedAt);
      var duration = moment.duration(now.diff(startedAt));
      var minutes = duration.asMinutes();
      //Se está a mais de 60 minutos rodando significa que está travado, tem que rodar novamente
      if (minutes >= 60) {
        await this.extractResumeService.updateEndedLock(lastExtract.id);
        lastExtract.state = ExtractResumeState.ENDED_LOCK;
      } else {
        const omitMessage = 'ommiting extract: running';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
    }

    let startDate = moment(extractStartDate).startOf('day');
    let endDate = moment(extractEndDate).endOf('day');

    let nextExtract: ExtractResume;
    if (!lastExtract || lastExtract?.state != ExtractResumeState.AWAITING_RUN) {
      nextExtract = await this.extractResumeService.createExtractResume({
        workspaceId: scheduleSetting.workspaceId,
        scheduleSettingId: scheduleSetting.id,
        createdAt: new Date(),
        extractRule: ExtractRule.MANUAL,
        type: data.type,
        settingTypeId: data.settingTypeId,
        uuid: v4(),
      });
    } else {
      nextExtract = lastExtract;
    }

    await this.extractResumeService.updateRange({
      id: nextExtract.id,
      startDate: startDate.clone(),
      endDate: endDate.clone(),
    });

    const { sendRecipientType, sendingGroupType } =
      this.getRecipientTypeAndSendingGroupType(data);
    this.enqueueScheduleKafka({
      scheduleSetting,
      extract: nextExtract,
      startDate,
      endDate,
      erpParams: data.erpParams,
      scheduleGroupRule: data.scheduleGroupRule,
      sendRecipientType,
      sendingGroupType,
      hoursBeforeScheduleDate,
    });
  }

  @CatchError()
  private async runHourlyStrategy(data: RunNextExtractData) {
    const { scheduleSetting, hoursBeforeScheduleDate } = data;
    const lastExtract =
      await this.extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
        {
          scheduleSettingId: scheduleSetting.id,
          type: data.type,
          settingTypeId: data.settingTypeId,
        },
      );

    const now = moment();

    if (!scheduleSetting?.useSendFullDay) {
      if (now.get('hour') < 6 || now.get('hour') > 22) {
        const omitMessage = 'ommiting extract: hourly interval';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
    }

    // Valida se o intervalo entre uma extração e outra é de no minimo a quantidade de minutos definida no campo getScheduleInterval
    if (lastExtract && lastExtract.endAt) {
      const endAt = moment(lastExtract?.endAt);
      const now = moment();
      const duration = moment.duration(now.diff(endAt));
      const minutes = duration.asMinutes();
      const getScheduleInterval =
        scheduleSetting?.getScheduleInterval < 5
          ? 5
          : scheduleSetting.getScheduleInterval ||
            this.defaultGetScheduleInterval;
      if (minutes <= getScheduleInterval) {
        const omitMessage =
          'ommiting extract: interval:' + getScheduleInterval + ' minutes';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
    }
    //Valida se a extração ainda está sendo executada
    if (lastExtract?.state == ExtractResumeState.RUNNING) {
      const now = moment();
      const startedAt = moment(lastExtract.startedAt);
      var duration = moment.duration(now.diff(startedAt));
      var minutes = duration.asMinutes();
      //Se está a mais de 60 minutos rodando significa que está travado, tem que rodar novamente
      if (minutes >= 60) {
        await this.extractResumeService.updateEndedLock(lastExtract.id);
        lastExtract.state = ExtractResumeState.ENDED_LOCK;
      } else {
        const omitMessage = 'ommiting extract: running';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
    }

    let nextExtract: ExtractResume;
    if (!lastExtract || lastExtract?.state != ExtractResumeState.AWAITING_RUN) {
      nextExtract = await this.extractResumeService.createExtractResume({
        workspaceId: scheduleSetting.workspaceId,
        scheduleSettingId: scheduleSetting.id,
        createdAt: new Date(),
        extractRule: ExtractRule.HOURLY,
        type: data.type,
        settingTypeId: data.settingTypeId,
        uuid: v4(),
      });
    } else {
      nextExtract = lastExtract;
    }

    let startDate = now.clone().add(1, 'day').startOf('day');
    let endDate = now.clone().add(1, 'day').endOf('day');

    if (hoursBeforeScheduleDate) {
      startDate = now
        .clone()
        .add(hoursBeforeScheduleDate, 'hour')
        .startOf('day');
      endDate = now.clone().add(hoursBeforeScheduleDate, 'hour').endOf('day');
    }
    // Se for sexta feira deve enviar de segunda
    if (now.clone().day() == 5 && scheduleSetting?.fridayJoinWeekendMonday) {
      startDate = now.clone().add(1, 'day').startOf('day');
      endDate = now.clone().add(3, 'day').endOf('day');
    }
    await this.extractResumeService.updateRange({
      id: nextExtract.id,
      startDate: startDate.clone(),
      endDate: endDate.clone(),
    });

    const { sendRecipientType, sendingGroupType } =
      this.getRecipientTypeAndSendingGroupType(data);
    this.enqueueScheduleKafka({
      scheduleSetting,
      extract: nextExtract,
      startDate,
      endDate,
      erpParams: data.erpParams,
      scheduleGroupRule: data.scheduleGroupRule,
      sendRecipientType,
      sendingGroupType,
      hoursBeforeScheduleDate,
    });
  }

  @CatchError()
  private async runDefaultStrategy(data: RunNextExtractData) {
    const { scheduleSetting, hoursBeforeScheduleDate } = data;
    const lastExtract =
      await this.extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
        {
          scheduleSettingId: scheduleSetting.id,
          type: data.type,
          settingTypeId: data.settingTypeId,
        },
      );
    // Valida se o intervalo entre uma extração e outra é de no minimo a quantidade de minutos definida no campo getScheduleInterval
    if (lastExtract && lastExtract.endAt) {
      const endAt = moment(lastExtract?.endAt);
      const now = moment();
      const duration = moment.duration(now.diff(endAt));
      const minutes = duration.asMinutes();
      const getScheduleInterval =
        scheduleSetting.getScheduleInterval || this.defaultGetScheduleInterval; // um dia
      if (minutes <= getScheduleInterval) {
        const ommitMessage =
          'ommiting extract: interval:' + getScheduleInterval + ' minutes';
        this.logger.debug(ommitMessage);
        return ommitMessage;
      }
    }
    //Valida se a extração ainda está sendo executada
    if (lastExtract?.state == ExtractResumeState.RUNNING) {
      const now = moment();
      const startedAt = moment(lastExtract.startedAt);
      var duration = moment.duration(now.diff(startedAt));
      var minutes = duration.asMinutes();
      //Se está a mais de 60 minutos rodando significa que está travado, tem que rodar novamente
      if (minutes >= 60) {
        await this.extractResumeService.updateEndedLock(lastExtract.id);
        lastExtract.state = ExtractResumeState.ENDED_LOCK;
      } else {
        const omitMessage = 'ommiting extract: running';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
    }
    //valida se a ultima extração foi na mesma hora do momento atual, pois deve rodar apenas uma vez por hora a extração
    if (lastExtract) {
      const lastExtractTime = moment(lastExtract.createdAt);
      const lastDay = lastExtractTime.get('day');
      const lastHour = lastExtractTime.get('hour');
      const now = moment();
      const nowDay = now.get('day');
      const nowHour = now.get('hour');
      if (nowDay == lastDay) {
        if (nowHour == lastHour) {
          const ommitMessage = `ommiting already extracted at day ${nowDay} and hour ${nowHour}`;
          this.logger.debug(ommitMessage);
          return ommitMessage;
        }
      }
    }
    let nextExtract: ExtractResume;
    if (!lastExtract || lastExtract?.state != ExtractResumeState.AWAITING_RUN) {
      nextExtract = await this.extractResumeService.createExtractResume({
        workspaceId: scheduleSetting.workspaceId,
        scheduleSettingId: scheduleSetting.id,
        createdAt: new Date(),
        extractRule: ExtractRule.DEFAULT,
        type: data.type,
        settingTypeId: data.settingTypeId,
        uuid: v4(),
      });
    } else {
      nextExtract = lastExtract;
    }
    const now = moment();
    let startDate = now.clone().add(1, 'day').startOf('hour');
    let endDate = now.clone().add(1, 'day').endOf('hour');
    if (hoursBeforeScheduleDate) {
      startDate = now
        .clone()
        .add(hoursBeforeScheduleDate, 'hour')
        .startOf('day');
      endDate = now.clone().add(hoursBeforeScheduleDate, 'hour').endOf('day');
    }
    await this.extractResumeService.updateRange({
      id: nextExtract.id,
      startDate: startDate.clone(),
      endDate: endDate.clone(),
    });

    const { sendRecipientType, sendingGroupType } =
      this.getRecipientTypeAndSendingGroupType(data);
    this.enqueueScheduleKafka({
      scheduleSetting,
      extract: nextExtract,
      startDate,
      endDate,
      erpParams: data.erpParams,
      scheduleGroupRule: data.scheduleGroupRule,
      sendRecipientType,
      sendingGroupType,
      hoursBeforeScheduleDate,
    });
  }


  @CatchError()
  private async runDailyV2Strategy(data: RunNextExtractData) {
    const { scheduleSetting, hoursBeforeScheduleDate } = data;
    const now = moment();
    const extractAt = 420; // Inicia as extrações as 7h da manhã
    if (extractAt / 60 > now.get('hour')) {
      const omitMessage =
        'ommiting extract: runHybridStrategy not on hour, setting ' +
        extractAt;
      this.logger.debug(omitMessage);
      return omitMessage;
    }

    if (!scheduleSetting?.useSendFullDay) {
      if (now.get('hour') < 6 || now.get('hour') > 22) {
        const omitMessage = 'ommiting extract: hybrid hourly interval';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
    }

    const lastExtract =
      await this.extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
        {
          scheduleSettingId: scheduleSetting.id,
          type: data.type,
          settingTypeId: data.settingTypeId,
        },
      );


    if (lastExtract?.state == ExtractResumeState.RUNNING) {
      const startedAt = moment(lastExtract.startedAt);
      var duration = moment.duration(now.diff(startedAt));
      var minutes = duration.asMinutes();
      if (minutes >= 60) {
        await this.extractResumeService.updateEndedLock(lastExtract.id);
        lastExtract.state = ExtractResumeState.ENDED_LOCK;
      } else {
        const omitMessage = 'ommiting extract: running';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
    }

     // Valida se o intervalo entre uma extração e outra é de no minimo a quantidade de minutos definida no campo getScheduleInterval
    if (lastExtract && lastExtract.endAt) {
      const endAt = moment(lastExtract?.endAt);
      const now = moment();
      const duration = moment.duration(now.diff(endAt));
      const minutes = duration.asMinutes();
      const getScheduleInterval =
        scheduleSetting?.getScheduleInterval < 5
          ? 5
          : scheduleSetting.getScheduleInterval ||
            this.defaultGetScheduleInterval;
      if (minutes <= getScheduleInterval) {
        const omitMessage =
          'ommiting extract: interval:' + getScheduleInterval + ' minutes';
        this.logger.debug(omitMessage);
        return omitMessage;
      }
    }

    let startDate = now.clone().add(1, 'day').startOf('day');
    let endDate = now.clone().add(1, 'day').endOf('day');

    if (hoursBeforeScheduleDate) {
      startDate = now
        .clone()
        .add(hoursBeforeScheduleDate, 'hour')
        .startOf('day');
      endDate = now.clone().add(hoursBeforeScheduleDate, 'hour').endOf('day');
    }

    const currentDay = now.day();
    if (currentDay === 5 && scheduleSetting?.fridayJoinWeekendMonday) {
      startDate = now.clone().add(1, 'day').startOf('day');
      endDate = now.clone().add(3, 'day').endOf('day');
    }

    let nextExtract: ExtractResume;
    if (!lastExtract || lastExtract?.state != ExtractResumeState.AWAITING_RUN) {
      nextExtract = await this.extractResumeService.createExtractResume({
        workspaceId: scheduleSetting.workspaceId,
        scheduleSettingId: scheduleSetting.id,
        createdAt: new Date(),
        extractRule: ExtractRule.DAILYV2,
        startRangeDate: startDate.clone().toDate(),
        endRangeDate: endDate.clone().toDate(),
        type: data.type,
        settingTypeId: data.settingTypeId,
        uuid: v4(),
      });
    } else {
      nextExtract = lastExtract;
      await this.extractResumeService.updateRange({
        id: nextExtract.id,
        startDate: startDate.clone(),
        endDate: endDate.clone(),
      });
    }

    const { sendRecipientType, sendingGroupType } =
      this.getRecipientTypeAndSendingGroupType(data);

    this.enqueueScheduleKafka({
      scheduleSetting,
      erpParams: data.erpParams,
      extract: nextExtract,
      startDate,
      endDate,
      scheduleGroupRule: ScheduleGroupRule.allOfRange,
      sendRecipientType,
      sendingGroupType,
      hoursBeforeScheduleDate,
    });
  }
  

  private enqueueScheduleKafka(data: RunExtractData) {
    const workspaceId = data.scheduleSetting.workspaceId;
    this.kafkaService.sendEvent(data, workspaceId, scheduleTopicName);
  }

  @CatchError()
  async runExtract(data: RunExtractData) {
    const { scheduleGroupRule } = data;
    // Ao Enviar para o kafka os campos moment são transformados em string;
    // Por isso devem ser parseados novamente para moment
    try {
      if (typeof data.startDate == 'string') {
        data.startDate = moment(data.startDate);
      }
      if (typeof data.endDate == 'string') {
        data.endDate = moment(data.endDate);
      }
    } catch (e) {
      Sentry.captureEvent({
        message: 'Error on runExtract parse startDate and endDate',
        extra: {
          error: e,
        },
      });
    }

    switch (scheduleGroupRule) {
      case ScheduleGroupRule.firstOfRange: {
        await this.runExtractFirstOfRange(data);
        break;
      }
      case ScheduleGroupRule.allOfRange: {
        await this.runExtractAllOfRange(data);
        break;
      }
      default: {
        await this.runExtractFirstOfRange(data);
        break;
      }
    }
  }

  async getSendScheduleList(
    type: ExtractResumeType,
    data: RunExtractData,
  ): Promise<SendSchedule[]> {
    try {
      switch (type) {
        case ExtractResumeType.schedule_notification: {
          return await this.integrationApiService.listScheduleNotifications(
            data.scheduleSetting.integrationId,
            0,
            data.startDate,
            data.erpParams,
            {
              EXTRACT_TYPE: data.extract.type,
              OMIT_EXTRACT_GUIDANCE: data.scheduleSetting?.omitExtractGuidance,
            },
          );
        }
        default: {
          return await this.integrationApiService.listSchedulesToSend(
            data.scheduleSetting.integrationId,
            0,
            data.startDate,
            data.endDate,
            data.erpParams,
            {
              EXTRACT_TYPE: data.extract.type,
              OMIT_EXTRACT_GUIDANCE: data.scheduleSetting?.omitExtractGuidance,
            },
            data.extract.uuid,
            data?.sendRecipientType === RecipientType.email,
          );
        }
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * Constroi a descrição do grupo de agendamentos
   */
  private buildGroupDescription(
    orderedGroup: SendSchedule[],
    scheduleSetting: ScheduleSetting,
  ): string {
    let groupDescription = orderedGroup.reduce(
      (previousValue: string, currentValue: SendSchedule) => {
        const { schedule } = currentValue;
        let time = ` ${moment(schedule.scheduleDate).format('HH:mm')} -`;
        if (scheduleSetting?.omitTimeOnGroupDescription) {
          time = '';
        }
        if (
          scheduleSetting?.useIsFirstComeFirstServedAsTime &&
          schedule.isFirstComeFirstServed
        ) {
          time = ' *Ordem de chegada* -';
        }
        const separator = '➡';
        let msg = `${previousValue ? `${previousValue} ${separator}` : ''}${time}`;
        if (
          !scheduleSetting?.omitAppointmentTypeName &&
          schedule?.appointmentTypeName &&
          schedule?.appointmentTypeName?.length > 1
        ) {
          msg = ` ${msg} ${schedule.appointmentTypeName} -`;
        }
        if (
          (typeof schedule?.appointmentTypeName == 'string' &&
            schedule?.appointmentTypeName?.toUpperCase?.() ==
              'CONSULTA') ||
          schedule?.appointmentTypeCode == 'C'
        ) {
          if (
            schedule?.specialityName &&
            schedule?.specialityName?.length > 1
          ) {
            msg = ` ${msg} ${schedule.specialityName} -`;
          }
        }
        // Senão tem tipo de agendamento nem nome do procedimento nem nome do médico adiciona a especialidad
        // A principio só para o sistema clinic que vai entrar nesse if pois em alguns casos só tem especialidade
        if (
          !schedule?.appointmentTypeName &&
          !schedule?.procedureName &&
          !schedule?.doctorName
        ) {
          if (
            schedule?.specialityName &&
            schedule?.specialityName?.length > 1
          ) {
            msg = ` ${msg} ${schedule.specialityName} -`;
          }
        }
        if (schedule?.procedureName) {
          let procedureName = schedule.procedureName;
          // Flag para pegar apenas a primeira parte do procedure name.
          // Exemplo: Ultrassonografia Obstétrica: com amniocentese (US) -> Ultrassonografia
          try {
            if (scheduleSetting?.useSpecialityOnExamMessage) {
              procedureName =
                procedureName?.split?.(' ')?.[0] || procedureName;
            }
          } catch (e) {
            Sentry.captureEvent({
              message: 'Error generating procedure name alias',
              extra: {
                error: e,
              },
            });
          }
          msg = ` ${msg} ${procedureName || schedule.procedureName} -`;
        }
        if (
          schedule?.doctorName &&
          schedule?.appointmentTypeCode != 'Q'
        ) {
          if(!scheduleSetting.omitDoctorName) {
            msg = ` ${msg} ${schedule.doctorName} -`;
          }
        }
        try {
          if (msg?.[msg?.length - 1] == '-') {
            msg = msg.substring(0, msg.length - 1);
          }
        } catch (e) {
          Sentry.captureEvent({
            message: 'Error on creating schedule: msg remove "-" char',
            extra: {
              error: e,
            },
          });
        }

        if (
          scheduleSetting?.useOrganizationUnitOnGroupDescription &&
          schedule?.organizationUnitName
        ) {
          msg = ` ${msg}(${schedule.organizationUnitName})`;
        }

        // Nova lógica para incluir endereço
        if (scheduleSetting.buildDescriptionWithAddress) {
          const addresses = orderedGroup.map(item => item.schedule?.organizationUnitAddress).filter(Boolean);
          const uniqueAddresses = [...new Set(addresses)];
          
          if (uniqueAddresses.length > 1 && schedule?.organizationUnitAddress) {
            // Endereços diferentes - adicionar ao final de cada agendamento
            msg = `${msg} - ${schedule.organizationUnitAddress}`;
          }
        }

        return msg;
      },
      '',
    );

    groupDescription = groupDescription?.trim?.() || '';

    // Adicionar endereço único ao final se todos os agendamentos têm o mesmo endereço
    if (scheduleSetting.buildDescriptionWithAddress) {
      const addresses = orderedGroup.map(item => item.schedule?.organizationUnitAddress).filter(Boolean);
      const uniqueAddresses = [...new Set(addresses)];
      
      if (uniqueAddresses.length === 1 && uniqueAddresses[0]) {
        groupDescription = `${groupDescription} - ${uniqueAddresses[0]}`;
      }
    }

    return groupDescription;
  }

  /**
   * Essa função envia apenas para o primeiro agendamento do range para um determinado paciente, porém agrupa antes os agendamentos
   * seta como confirmado todos do grupo
   */
  private async runExtractAllOfRange(data: RunExtractData) {
    const { scheduleSetting, extract, erpParams, hoursBeforeScheduleDate } =
      data;
    await this.extractResumeService.updateStart(data.extract.id);
    this.logger.log(
      'Starting run schedule extractor(runExtractAllOfRange) to settingId:' +
        scheduleSetting.name +
        scheduleSetting.workspaceId,
    );
    try {
      // Lista os agendamentos a serem enviados pela integração
      let extractedScheduleList = await this.getSendScheduleList(
        extract.type,
        data,
      );

      // Gera o dia do agendamento sem hora e minuto com base no campo de data do agendamento, que contém hora e minuto
      // Isso é pra que seja possivel agrupar por dia
      extractedScheduleList = extractedScheduleList.map((schedule) => {
        schedule.schedule.scheduleDateDay = moment(
          schedule.schedule.scheduleDate,
        ).format('YYYY-MM-DD');
        return schedule;
      });

      // Agrupa por dia, pois como o range de datas pode trazer agendamentos de mais de um dia por paciente pode ter o cenário de
      // enviar um agendamento com data errada
      // https://botdesigner.freshdesk.com/a/tickets/5879 ticket com o cenário descrito acima
      const dayGroups = groupBy(
        extractedScheduleList,
        'schedule.scheduleDateDay',
      );

      let extractedCount = extractedScheduleList.length;
      let processedCount = 0;
      let sendedCount = 0;

      for (const dayGroupKey of Object.keys(dayGroups)) {
        const scheduleToSendList: Array<SendSchedule> = dayGroups[dayGroupKey];

        let groups;
        try {
          groups = groupBy(scheduleToSendList, (item) => {
            if (item.contact.code && item.contact.code != 'null')
              return item.contact.code;
            if (item.contact?.phone?.[0]) return item.contact?.phone?.[0];
            if (item.contact?.name) return item.contact?.name;
          });
        } catch (e) {
          groups = groupBy(scheduleToSendList, 'contact.code');
        }

        for (const groupKey of Object.keys(groups)) {
          const group: Array<SendSchedule> = groups[groupKey];
          const groupId = v4();
          let orderedGroup = orderBy(group, 'schedule.scheduleDate', 'asc');
          try {
            if (data.scheduleSetting.sendOnlyPrincipalExam) {
              orderedGroup = orderedGroup.filter((sch) =>
                typeof sch?.schedule?.isPrincipal == 'boolean'
                  ? sch?.schedule?.isPrincipal
                  : true,
              );
              if (orderedGroup.length == 0) {
                orderedGroup = orderBy(
                  group,
                  ['schedule.isFirstComeFirstServed', 'schedule.scheduleDate'],
                  ['desc', 'asc'],
                );
                Sentry.captureEvent({
                  message: 'Error on ordering schedules: Empty group',
                  extra: {
                    group: JSON.stringify(group),
                  },
                });
              }
            } else {
              orderedGroup = orderBy(
                group,
                [
                  'schedule.isPrincipal',
                  'schedule.isFirstComeFirstServed',
                  'schedule.scheduleDate',
                ],
                ['desc', 'desc', 'asc'],
              );
            }
          } catch (e) {
            Sentry.captureEvent({
              message:
                'Error on ordering schedules: schedule.isPrincipal: desc, schedule.scheduleDate: asc ',
              extra: {
                error: e,
              },
            });
          }

          if (data?.scheduleSetting?.extractRule == ExtractRule.HOURLY) {
            const now = moment();
            const mmtMidnight = now.clone().startOf('day');
            const nowDiffMinutes = now.diff(mmtMidnight, 'minutes');
            const nowSchedule = moment(
              orderedGroup?.[0]?.schedule?.scheduleDate,
            );
            const mmtMidnightSchedule = nowSchedule.clone().startOf('day');
            const nowDiffMinutesSchedule = nowSchedule.diff(
              mmtMidnightSchedule,
              'minutes',
            );
            if (nowDiffMinutesSchedule > nowDiffMinutes) {
              continue;
            }
          }

          if (data?.scheduleSetting?.extractRule == ExtractRule.DEFAULT) {
            //Se  a diferença entre now e schedule date é MAIOR que sendSetting.hoursBeforeScheduleDate dai da um continue
            const now = moment();
            const scheduleDateMMT = moment(
              orderedGroup?.[0]?.schedule?.scheduleDate,
            );
            const nowDiffSchedule = scheduleDateMMT.diff(now, 'minute');
            if (
              nowDiffSchedule >= hoursBeforeScheduleDate * 60 ||
              now.valueOf() >= scheduleDateMMT.valueOf()
            ) {
              continue;
            }
          }

          let groupDescription = this.buildGroupDescription(
            orderedGroup,
            scheduleSetting,
          );
          const groupCodeList = orderedGroup.reduce(
            (previousValue: string, currentValue: SendSchedule) => {
              const { schedule } = currentValue;
              return `${previousValue ? `${previousValue},` : ''}${schedule.scheduleCode}`;
            },
            '',
          );
          const groupIdList = orderedGroup.reduce(
            (previousValue: string, currentValue: SendSchedule) => {
              const { schedule } = currentValue;
              return `${previousValue ? `${previousValue},` : ''}${schedule.scheduleId}`;
            },
            '',
          );

          const promises = orderedGroup.map(async (scheduleToSend, index) => {
            try {

              // const scheduleToSend = orderedGroup[0];
              const { contact, schedule } = scheduleToSend;
              
              let address = schedule.organizationUnitAddress;
              try {
                // Remove quebras de linha e espaços extras
                address = address?.replace(/\s*\n\s*/g, ' ').trim();
              } catch (e) {
                this.logger.warn('Erro ao limpar endereço', e);
              }
              // Obtém o número de telefone completo do contato
              const phone = contact?.phone?.[0]
                ? getCompletePhone(contact.phone[0])
                : null;
              // Cria um objeto de agendamento com os dados necessários
              const scheduleToCreate: Schedule = {
                scheduleSettingId: scheduleSetting.id,
                integrationId: scheduleSetting.integrationId,
                workspaceId: scheduleSetting.workspaceId,
                scheduleCode: schedule.scheduleCode,
                //ATENÇÃO: Campo scheduleId do schedule não é o mesmo do scheduleId do scheudle_message. na entidade schedule o scheduleId é o do integrations e na
                // entidade schedule_message é a referencia pra join do schedule.id
                scheduleId: String(schedule.scheduleId),
                principalScheduleCode: schedule.principalScheduleCode,
                isPrincipal: !!schedule.isPrincipal,
                isFirstComeFirstServed: schedule.isFirstComeFirstServed,
                scheduleDate: new Date(schedule.scheduleDate),
                patientPhone: phone,
                patientName: contact.name,
                patientCode: contact.code,
                organizationUnitAddress: address,
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
                insuranceName: schedule.insuranceName,
                insuranceCode: schedule.insuranceCode,
                insurancePlanName: schedule.insurancePlanName,
                insurancePlanCode: schedule.insurancePlanCode,
                createdAt: new Date(),
                patientEmail: contact?.email?.[0],
                groupId,
                groupDescription,
                groupCodeList,
                groupIdList,
                groupCount: orderedGroup?.length,
                extractResumeId: extract.id,
                data: schedule.data,
              };

              let dataToCreateSchedule: CreateScheduleAndScheduleMessageData = {
                apiKey: scheduleSetting.apiKey,
                emailList: [],
                phoneList: [],
                extractResumeType: extract.type,
                settingTypeId: extract.settingTypeId,
                schedule: scheduleToCreate,
                sendRecipientType: data.sendRecipientType,
                sendingGroupType: data.sendingGroupType,
                orderedGroup,
              };
              if (data.sendRecipientType === RecipientType.email) {
                dataToCreateSchedule.emailList = !!contact?.email?.length ? contact.email : [];
              } else {
                dataToCreateSchedule.phoneList = contact.phone;
              }

              //Se for o primeiro horario envia, senão apenas salva o schedule. pois está agrupado no primeiro horário
              // e o primeiro horário é o 'pai'
              if (index == 0) {
                const sended =
                  await this.scheduleService.createScheduleAndScheduleMessage(
                    dataToCreateSchedule,
                  );
                if (sended) {
                  sendedCount = sendedCount + 1;
                }
              } else {
                //Apenas cria o schedule mas não envia pois já enviou o primeiro do grupo com as informações
                // de todos os agendamentos da variavel groupDescription
                await this.scheduleService.getOrCreateSchedule(
                  dataToCreateSchedule,
                );
              }
              processedCount = processedCount + 1;
            } catch (e) {
              try {
                // Dependendo do sistema(MV)
                if (
                  !(e?.message as string)?.startsWith?.(
                    'duplicate key value violates unique constraint',
                  )
                ) {
                  this.logger.error(
                    'Error on creating schedule: runExtractAllOfRange',
                  );
                  console.log(e);
                  // Registra o erro no Sentry
                  Sentry.captureEvent({
                    message: 'Error on creating schedule: runExtractAllOfRange',
                    extra: {
                      error: e,
                    },
                  });
                }
              } catch (e2) {
                Sentry.captureEvent({
                  message:
                    'Error on creating schedule: runExtractAllOfRange try 2',
                  extra: {
                    error: e2,
                  },
                });
              }
            }
          });
          await Promise.all(promises);
        }
      }

      await this.extractResumeService.updateEnded(
        data.extract.id,
        extractedCount,
        processedCount,
        sendedCount,
      );
    } catch (e) {
      Sentry.captureEvent({
        message: 'Error on creating schedule group date: runExtractAllOfRange',
        extra: {
          error: e,
        },
      });
      // Atualiza o estado da extração para "Finalizado com erro e a data
      await this.extractResumeService.updateEndedError(data.extract.id, e);
    }
  }

  /**
   * Essa função envia apenas para o primeiro agendamento do range para um determindao paciente e ignora os seguintes
   */
  private async runExtractFirstOfRange(data: RunExtractData) {
    const { scheduleSetting, extract, erpParams } = data;
    // Atualiza o estado da extração para "Executando" e a data/hora de início
    await this.extractResumeService.updateStart(data.extract.id);
    // Registra no log que a extração está sendo iniciada
    this.logger.log(
      'Starting run schedule extractor(runExtractFirstOfRange) to settingId:' +
        scheduleSetting.workspaceId,
    );
    try {
      // Lista os agendamentos a serem confirmados pela integração
      let scheduleToConfirmList =
        await this.integrationApiService.listSchedulesToSend(
          scheduleSetting.integrationId,
          0,
          data.startDate,
          data.endDate,
          erpParams,
          {
            EXTRACT_TYPE: extract.type,
            OMIT_EXTRACT_GUIDANCE: scheduleSetting?.omitExtractGuidance,
          },
          data.extract.uuid,
          data?.sendRecipientType === RecipientType.email,
        );

      let extractedCount = scheduleToConfirmList.length;

      try {
        const orderedByScheduleDate = orderBy(
          scheduleToConfirmList,
          'schedule.scheduleDate',
          'asc',
        );
        const uinqScheduleToConfirmList = uniqBy(
          orderedByScheduleDate,
          'contact.code',
        );
        scheduleToConfirmList = uinqScheduleToConfirmList;
      } catch (e) {
        Sentry.captureEvent({
          message: `${ExtractResumeService.name}.runExtract: orderBy uniqBy`,
          extra: {
            error: e,
          },
        });
      }
      // Lança uma exceção se a lista de agendamentos a serem confirmados for falsy
      if (!scheduleToConfirmList)
        throw Exceptions.CANNOT_GET_LIST_SCHEDULES_FROM_INTEGRATIONS;
      let processedCount = 0;
      let sendedCount = 0;
      // Percorre a lista de agendamentos a serem confirmados
      for (const scheduleToConfirm of scheduleToConfirmList) {
        const { contact } = scheduleToConfirm;
        // Percorre a lista de agendamentos do contato
        for (const schedule of [scheduleToConfirm.schedule]) {
          try {
            if (
              (data.sendRecipientType === RecipientType.whatsapp &&
                contact?.phone?.[0]) ||
              (data.sendRecipientType === RecipientType.email && contact?.email?.[0])
            ) {
              // Obtém o número de telefone completo do contato
              const phone = getCompletePhone(contact.phone[0]);
              // Cria um objeto de agendamento com os dados necessários
              const scheduleToCreate: Schedule = {
                scheduleSettingId: scheduleSetting.id,
                integrationId: scheduleSetting.integrationId,
                workspaceId: scheduleSetting.workspaceId,
                scheduleCode: schedule.scheduleCode,
                //ATENÇÃO: Campo scheduleId do schedule não é o mesmo do scheduleId do scheudle_message. na entidade schedule o scheduleId é o do integrations e na
                // entidade schedule_message é a referencia pra join do schedule.id
                scheduleId: String(schedule.scheduleId),
                principalScheduleCode: schedule.principalScheduleCode,
                isPrincipal: !!schedule.isPrincipal,
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
                insuranceName: schedule.insuranceName,
                insuranceCode: schedule.insuranceCode,
                insurancePlanName: schedule.insurancePlanName,
                insurancePlanCode: schedule.insurancePlanCode,
                createdAt: new Date(),
                patientEmail: contact?.email?.[0],
                extractResumeId: extract.id,
                data: schedule.data,
              };
              let phoneList = [];
              let emailList: string[] = [];

              if (data?.sendRecipientType === RecipientType.email) {
                emailList = !!contact?.email?.length ? contact.email : [];
              } else {
                phoneList = contact.phone;
              }
              // Cria o agendamento no sistema e incrementa o contador de extrações realizadas
              // await this.scheduleService.createScheduleAndSendConfirmation(scheduleToCreate, data.setting.apiKey);
              const sended =
                await this.scheduleService.createScheduleAndScheduleMessage({
                  schedule: scheduleToCreate,
                  phoneList: phoneList,
                  emailList: emailList,
                  apiKey: scheduleSetting.apiKey,
                  extractResumeType: extract.type,
                  settingTypeId: extract.settingTypeId,
                  sendRecipientType: data.sendRecipientType,
                  sendingGroupType: data.sendingGroupType,
                });
              if (sended) {
                sendedCount = sendedCount + 1;
              }
              processedCount = processedCount + 1;
            }
          } catch (e) {
            this.logger.error('Error on creating schedule');
            console.log(e);
            // Registra o erro no Sentry
            Sentry.captureEvent({
              message: 'Error on creating schedule',
              extra: {
                error: e,
              },
            });
          }
        }
      }
      // Atualiza o estado da extração para "Finalizado" e a data/hora de término, juntamente com o número de agendamentos extraídos
      await this.extractResumeService.updateEnded(
        data.extract.id,
        extractedCount,
        processedCount,
        sendedCount,
      );
    } catch (e) {
      console.log(e);
      // Atualiza o estado da extração para "Finalizado com erro e a data
      await this.extractResumeService.updateEndedError(data.extract.id, e);
    }
  }
}
