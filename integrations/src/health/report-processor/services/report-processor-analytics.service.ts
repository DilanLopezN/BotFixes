import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INTEGRATIONS_CONNECTION_NAME } from '../../ormconfig';
import { ReportProcessorAnalytics } from '../entities/report-processor-analytics.entity';
import { ReportProcessorAnalyticsInterface } from '../interfaces/report-processor-analytics.interface';
import { AIProviderType } from '../../ai/interfaces';
import { AiExecuteData } from '../../ai/interfaces/ai-execute-data';
import { ExtractMedicalRequestDataResponse } from '../interfaces/extract-medical-request-data.inteface';
import { castObjectIdToString } from '../../../common/helpers/cast-objectid';

@Injectable()
export class ReportProcessorAnalyticsService {
  constructor(
    @InjectRepository(ReportProcessorAnalytics, INTEGRATIONS_CONNECTION_NAME)
    private readonly reportProcessorAnalyticsRepository: Repository<ReportProcessorAnalytics>,
  ) {}

  async createAnalyticsRecord(
    data: Partial<ReportProcessorAnalyticsInterface>,
  ): Promise<ReportProcessorAnalytics | null> {
    try {
      const record = this.reportProcessorAnalyticsRepository.create(data);
      return await this.reportProcessorAnalyticsRepository.save(record);
    } catch (error) {
      console.error('Failed to create analytics record:', error.message);
      return null;
    }
  }

  async updateAnalyticsRecord(
    recordId: number,
    data: Partial<ReportProcessorAnalyticsInterface>,
  ): Promise<ReportProcessorAnalytics | null> {
    try {
      await this.reportProcessorAnalyticsRepository.update(recordId, data);
      return await this.reportProcessorAnalyticsRepository.findOneBy({ id: recordId });
    } catch (error) {
      console.error(`Failed to update analytics record ${recordId}:`, error.message);
      return null;
    }
  }
}
