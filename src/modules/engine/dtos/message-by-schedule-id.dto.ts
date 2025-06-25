import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GetMessageByScheduleDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    scheduleId: string;
}
