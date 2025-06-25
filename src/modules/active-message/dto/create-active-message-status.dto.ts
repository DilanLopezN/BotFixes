import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { CreateActiveMessageStatusData } from "../interfaces/create-active-message-status-data.interface";

export class CreateActiveMessageStatusDto implements Omit<CreateActiveMessageStatusData, 'workspaceId'> {
    @IsNumber()
    @ApiProperty()
    statusCode: number;
    
    @IsString()
    @ApiProperty()
    statusName: string;
}