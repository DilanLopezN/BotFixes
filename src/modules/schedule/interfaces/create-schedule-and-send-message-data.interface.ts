
export interface CreateScheduleAndScheduleMessageData {
    schedule: Partial<string>;
    phoneList: string[];
    emailList: string[];
    apiKey: string;
    extractResumeType: string;
    settingTypeId: number;
    sendRecipientType: string;
    sendingGroupType: string;
}