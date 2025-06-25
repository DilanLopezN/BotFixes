import { IsString } from 'class-validator';

export class CancelReasonDto {
    @IsString()
    reasonName: string;

    @IsString()
    workspaceId: string;
}

export class CreateCancelReasonDto {
    @IsString()
    reasonName: string;
}

export class UpdateCancelReasonDto extends CreateCancelReasonDto {}
