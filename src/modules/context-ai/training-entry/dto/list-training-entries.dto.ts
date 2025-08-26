import { IsString } from 'class-validator';

export class ListTrainingEntriesDto {
    @IsString()
    agentId: string;
}
