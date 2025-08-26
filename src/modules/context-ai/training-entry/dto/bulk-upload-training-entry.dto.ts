import { IsUUID, IsNotEmpty } from 'class-validator';

export class BulkUploadTrainingEntryDto {
    @IsUUID()
    @IsNotEmpty()
    agentId: string;
}
