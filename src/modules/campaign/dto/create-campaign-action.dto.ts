import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCampaignActionDto {
    @IsString()
    @ApiProperty()
    name: string;

    @IsString()
    @ApiProperty()
    action: string;
}

export class UpdateCampaignActionDto {
    @IsString()
    @ApiProperty()
    name: string;
}
