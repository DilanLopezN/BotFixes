import { IsNumber, IsString } from 'class-validator';

export class ListDiagnosticExtractionsDto {
  @IsNumber()
  scheduleSettingId: number;

  @IsString()
  workspaceId: string;
}
