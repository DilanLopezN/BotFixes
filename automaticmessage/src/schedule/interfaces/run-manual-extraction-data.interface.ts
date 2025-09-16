import { ExtractResumeType } from '../models/extract-resume.entity';

export interface RunManualExtractionData {
  scheduleSettingId: number;
  extractResumeType: ExtractResumeType;
  extractEndDate: Date;
  extractStartDate: Date;
}
