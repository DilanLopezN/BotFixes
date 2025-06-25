import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { CheckConversationExistsData } from "../interfaces/check-conversation-exists.interface";

export class CheckConversationExistsDto implements CheckConversationExistsData {
    @IsString()
    @ApiProperty()
    apiToken: string;

    @IsString()
    @ApiProperty()
    phoneNumber: string;
}