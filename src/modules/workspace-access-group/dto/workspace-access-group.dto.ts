import { ApiProperty } from "@nestjs/swagger";

export class AccessSetting {
    @ApiProperty({type: [String]})
    userList: string[]

    @ApiProperty({type: [String]})
    ipListData: string[];
}

export class CreateAccesGroupDto {
    @ApiProperty()
    name: string;

    @ApiProperty({type: [AccessSetting]})
    accessSettings: AccessSetting;
}