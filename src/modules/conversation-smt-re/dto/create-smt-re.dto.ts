import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSmtReDto {
    @IsString()
    @IsNotEmpty()
    conversationId: string;

    @IsString()
    @IsNotEmpty()
    workspaceId: string;

    @IsString()
    @IsNotEmpty()
    smtReSettingId: string;
}
