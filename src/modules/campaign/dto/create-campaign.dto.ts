import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsString } from "class-validator";
import { CreateCampaignData } from "../interfaces/create-campaign-data.interface";
import { CampaignType } from "../models/campaign.entity";

export class CreateCampaignDto implements Omit<CreateCampaignData, 'workspaceId'> {
    @IsString()
    @ApiProperty()
    name: string;

    @IsString()
    @ApiProperty()
    description?: string;

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
    @ApiProperty()
    campaignType?: CampaignType;

    @IsNumber()
    @ApiProperty()
    clonedFrom?: number;


    @IsBoolean()
    @ApiProperty()
    isTest?: boolean;
}