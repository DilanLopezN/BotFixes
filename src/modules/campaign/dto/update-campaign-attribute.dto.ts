import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { UpdateCampaignAttributeData } from "../interfaces/update-campaign-attribute-data.interface";

export class UpdateCampaignAttributeDto implements UpdateCampaignAttributeData {

    @IsNumber()
    @ApiProperty()
    id: number;

    @IsNumber()
    @ApiProperty()
    campaignId: number;

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