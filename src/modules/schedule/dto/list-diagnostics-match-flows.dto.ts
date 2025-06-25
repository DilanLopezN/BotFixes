import { IsString } from 'class-validator';

enum TriggerEnum {
    active_confirmation_confirm = 'active_confirmation_confirm',
    active_confirmation_cancel = 'active_confirmation_cancel',
}

export class ListDiagnosticMatchFlowsDto {
    @IsString()
    trigger: TriggerEnum;

    @IsString({ each: true })
    scheduleIds: string[];

    @IsString()
    integrationId: string;
}
