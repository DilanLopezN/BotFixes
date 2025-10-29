export enum SettingType {
    confirmation = 'confirmation',
    reminder = 'reminder',
    sendSetting = 'sendSetting',
}

export interface ToggleSettingActiveDto {
    id: number;
    workspaceId: string;
    active: boolean;
    settingType: SettingType;
    type?: string; // ExtractResumeType - obrigatório para sendSetting
}
