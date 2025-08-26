import { IsNumber } from 'class-validator';

export class StartBreakDto {
    @IsNumber()
    breakSettingId: number;
}
