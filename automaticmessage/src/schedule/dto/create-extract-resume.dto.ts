import {
  ExtractResume,
  ExtractResumeType,
} from '../models/extract-resume.entity';

export class CreateExtractResumeDto {
  scheduleSettingId: number;
  type: ExtractResumeType;
  startRangeDate: string;
  endRangeDate: string;
}
