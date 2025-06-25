import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { ListMessageslId } from "../interfaces/get-active-message-external-id.interface";

export class ListMessagesDto implements ListMessageslId {
    @IsString()
    @ApiProperty()
    apiToken: string;
    
    @IsString()
    @ApiProperty()
    externalId: string;

    @IsString()
    @ApiProperty()
    startDate: string;

    @IsString()
    @ApiProperty()
    endDate: string;

    @IsString()
    @ApiProperty()
    statusChangedAfter: string;
}