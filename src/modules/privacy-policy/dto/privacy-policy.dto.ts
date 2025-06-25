import { IsDate, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePrivacyPolicyDto {
    @IsString()
    @MaxLength(1000)
    text: string;

    @IsString({ each: true })
    channelConfigIds: string[];

    @IsString()
    @IsOptional()
    acceptButtonText?: string;

    @IsString()
    @IsOptional()
    rejectButtonText?: string;
}

export class UpdatePrivacyPolicyDto extends CreatePrivacyPolicyDto {
    @IsNumber()
    id: number;

    @IsString()
    workspaceId: string;

    @IsString()
    @IsOptional()
    createdBy: string;

    @IsOptional()
    createdAt: Date;

    @IsOptional()
    updateAcceptanceAt?: Date;
}
