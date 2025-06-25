import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsString } from "class-validator";
import { UpdateCampaignData } from "../interfaces/update-campaign-data.interface";
import { CampaignType } from "../models/campaign.entity";

export class UpdateCampaignDto implements Omit<UpdateCampaignData, 'id' | 'workspaceId'> {
    @IsString()
    @ApiProperty()
    name: string;

    @IsString()
    @ApiProperty()
    templateId?: string;
    
    @IsNumber()
    @ApiProperty()
    sendAt?: number;
    
    @IsNumber()
    @ApiProperty()
    sendInterval?: number;
    
    @IsString()
    @ApiProperty({enum: CampaignType})
    campaignType?: CampaignType;

    @IsBoolean()
    @ApiProperty()
    isTest?: boolean;
}