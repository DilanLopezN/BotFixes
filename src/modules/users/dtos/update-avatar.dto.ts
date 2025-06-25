import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateAvatarDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly workspaceId: string;
}
