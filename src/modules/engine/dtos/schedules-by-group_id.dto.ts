import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GetSchedulesByGroupIdDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    groupId: string;
}
