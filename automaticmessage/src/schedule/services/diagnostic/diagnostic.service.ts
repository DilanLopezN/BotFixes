import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { SCHEDULE_CONNECTION_NAME } from '../../connName';
import { ScheduleSettingService } from '../schedule/schedule-setting.service';
import {
  ExtractRule,
  ScheduleSetting,
} from '../../models/schedule-setting.entity';
import { ExtractResumeType } from '../../models/extract-resume.entity';
import { RunExtractResumeService } from '../extract/run-extract-resume.service';
import { RunManualExtractionData } from '../../interfaces/run-manual-extraction-data.interface';
import { IntegrationApiService } from '../integration-api.service';
import { RecipientType } from '../../models/schedule-message.entity';
import * as moment from 'dayjs';
import { ListExtractData } from '../../interfaces/list-extract-data.interface';
import { v4 } from 'uuid';

@Injectable()
export class DiagnosticService {
  constructor(
    @InjectConnection(SCHEDULE_CONNECTION_NAME)
    private conn: Connection,
    private scheduleSettingService: ScheduleSettingService,
    private runExtractResumeService: RunExtractResumeService,
    private readonly integrationApiService: IntegrationApiService,
  ) {}

  async listDiagnosticExtractions(
    scheduleSettingId: number,
    workspaceId: string,
  ) {
    return this.conn.query(`
        select
          a.id, substring(b.name, 1, 20),
          a.created_at, a.started_at,
          a.end_at, a.state,
          a.processed_count as p_count,
          a.extracted_count as extra_cnt,
          a.sended_count as send_cnt,
          a.start_range_date,
          a.end_range_date,
          a.extract_rule,
          a.type
        from schedule.extract_resume as a
        left join billing.workspace as b on b.id = a.workspace_id
        where 
          a.schedule_setting_id = ${scheduleSettingId}
          and a.workspace_id = '${workspaceId}'
        order by a.id desc limit 50
        `);
  }

  async runManualExtraction(
    data: RunManualExtractionData,
    workspaceId: string,
  ) {
    const {
      scheduleSettingId,
      extractEndDate,
      extractResumeType,
      extractStartDate,
    } = data;
    const scheduleSetting =
      await this.scheduleSettingService.getScheduleSettingByIdWithSubSettings(
        scheduleSettingId,
        workspaceId,
      );
    const sendSetting = await this.getSendSettingByType(
      scheduleSetting,
      extractResumeType,
    );
    await this.runExtractResumeService.runNextExtract({
      scheduleSetting,
      type: extractResumeType,
      hoursBeforeScheduleDate: 0,
      settingTypeId: sendSetting.id,
      erpParams: sendSetting.erpParams,
      scheduleGroupRule: sendSetting.groupRule,
      extractRuleParam: ExtractRule.MANUAL,
      extractEndDate,
      extractStartDate,
    });
  }

  private async getSendSettingByType(
    scheduleSetting: ScheduleSetting,
    extractResumeType: ExtractResumeType,
  ) {
    switch (extractResumeType) {
      case ExtractResumeType.confirmation: {
        return scheduleSetting?.confirmationSettings?.[0];
      }
      case ExtractResumeType.reminder: {
        return scheduleSetting?.reminderSettings?.[0];
      }
      default: {
        const sendSetting = scheduleSetting.sendSettings.find(
          (sett) => sett.type === extractResumeType,
        );
        return sendSetting;
      }
    }
  }

  async listExtractData(data: ListExtractData, workspaceId: string) {
    const {
      scheduleSettingId,
      extractEndDate,
      extractResumeType,
      extractStartDate,
    } = data;
    const scheduleSetting =
      await this.scheduleSettingService.getScheduleSettingByIdWithSubSettings(
        scheduleSettingId,
        workspaceId,
      );

    const sendSetting = await this.getSendSettingByType(
      scheduleSetting,
      extractResumeType,
    );

    let extractedScheduleList =
      await this.runExtractResumeService.getSendScheduleList(
        data.extractResumeType,
        {
          endDate: moment(data.extractEndDate),
          startDate: moment(data.extractStartDate),
          scheduleSetting,
          extract: {
            uuid: v4(),
            type: data.extractResumeType,
          } as any,
          erpParams: sendSetting.erpParams,
          scheduleGroupRule: sendSetting.groupRule,
          sendRecipientType: RecipientType.blank,
          sendingGroupType: 'principal',
          hoursBeforeScheduleDate: 0,
        },
      );
    return extractedScheduleList;
  }
}
