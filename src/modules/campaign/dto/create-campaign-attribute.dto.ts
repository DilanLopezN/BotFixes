import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { CreateCampaignAttributeData } from "../interfaces/create-campaign-attribute-data.interface";

export class CreateCampaignAttributeDto implements Omit<CreateCampaignAttributeData, 'campaignId'> {

    @IsString()
    @ApiProperty()
    label: string;

    @IsString()
    @ApiProperty()
    name: string;

    @IsString()
    @ApiProperty()
    templateId?: string;
} 