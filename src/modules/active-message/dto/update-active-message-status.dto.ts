import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { UpdateActiveMessageStatusData } from "../interfaces/update-active-message-status-data.interface";

export class UpdateActiveMessageStatusDto implements Omit<UpdateActiveMessageStatusData, 'id'> {
    @IsNumber()
    @ApiProperty()
    statusCode: number;
    
    @IsString()
    @ApiProperty()
    statusName: string;
}