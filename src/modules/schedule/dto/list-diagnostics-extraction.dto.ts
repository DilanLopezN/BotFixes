import { IsNumber } from 'class-validator';

export class ListDiagnosticExtractionsDto {
    @IsNumber()
    scheduleSettingId: number;
}
