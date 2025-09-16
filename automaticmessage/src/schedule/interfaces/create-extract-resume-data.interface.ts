import { ExtractResumeType } from '../models/extract-resume.entity';

export interface CreateExtractResumeData {
  scheduleSettingId: number;
  type: ExtractResumeType;
  workspaceId: string;
  startRangeDate: string;
  endRangeDate: string;
}
