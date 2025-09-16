import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'dayjs';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { SCHEDULE_CONNECTION_NAME } from '../../connName';
import {
  ExtractResume,
  ExtractResumeState,
  ExtractResumeType,
} from '../../models/extract-resume.entity';
import {
  ExtractRule,
  ScheduleSetting,
} from '../../models/schedule-setting.entity';
import { RunNextExtractData } from '../../interfaces/run-next-extarct-data.interface';
import * as Sentry from '@sentry/node';

@Injectable()
export class ExtractResumeService {
  private readonly logger = new Logger(ExtractResumeService.name);

  constructor(
    @InjectRepository(ExtractResume, SCHEDULE_CONNECTION_NAME)
    private repo: Repository<ExtractResume>,
  ) {}

  async createExtractResume(data: Partial<ExtractResume>) {
    return await this.repo.save(data);
  }

  async getDailyExtracts({
    scheduleSetting,
    now,
    data,
  }: {
    scheduleSetting: ScheduleSetting;
    now: moment.Dayjs;
    data: RunNextExtractData;
  }) {
    return await this.repo.findOne({
      where: {
        workspaceId: scheduleSetting.workspaceId,
        scheduleSettingId: scheduleSetting.id,
        createdAt: MoreThanOrEqual(now.clone().startOf('day').toDate()),
        extractRule: ExtractRule.DAILY,
        type: data.type,
        settingTypeId: data.settingTypeId,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId({
    scheduleSettingId,
    type,
    settingTypeId,
  }: {
    scheduleSettingId: number;
    type: ExtractResumeType;
    settingTypeId: number;
  }) {
    return await this.repo.findOne({
      where: {
        scheduleSettingId,
        type,
        settingTypeId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateRange({
    id,
    startDate,
    endDate,
  }: {
    id: number;
    startDate: moment.Dayjs;
    endDate: moment.Dayjs;
  }) {
    await this.repo.update(
      {
        id,
      },
      {
        startRangeDate: startDate.clone().toDate(),
        endRangeDate: endDate.clone().toDate(),
      },
    );
  }

  async updateStart(id: number) {
    await this.repo.update(
      {
        id: id,
      },
      {
        startedAt: new Date(),
        state: ExtractResumeState.RUNNING,
      },
    );
  }

  async updateEnded(
    id: number,
    extractedCount: number,
    processedCount: number,
    sendedCount: number,
  ) {
    await this.repo.update(
      {
        id,
      },
      {
        endAt: new Date(),
        state: ExtractResumeState.ENDED,
        extractedCount,
        processedCount,
        sendedCount,
      },
    );
  }

  async updateEndedLock(id: number) {
    await this.repo.update(
      {
        id,
      },
      {
        endAt: new Date(),
        state: ExtractResumeState.ENDED_LOCK,
      },
    );
  }

  async updateEndedError(id: number, e: any) {
    let error: string = '{}';
    try {
      error = JSON.stringify(e);
    } catch (err) {
      console.log('ExtractResumeService.updateEndedError', err);
      Sentry.captureEvent({
        message: `${ExtractResumeService.name}.updateEndedError`,
        extra: {
          error: err,
        },
      });
    }
    await this.repo.update(
      {
        id,
      },
      {
        endAt: new Date(),
        state: ExtractResumeState.ENDED_ERROR,
        error,
      },
    );
  }
}
