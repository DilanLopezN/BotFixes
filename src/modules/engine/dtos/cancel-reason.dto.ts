import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray } from 'class-validator';

export class ReasonIdsQueryDto {
    @ApiProperty({ description: 'Reason ids', type: [Number] })
    @IsNumber({}, { each: true })
    @IsArray()
    reasonIds: number[];
}

export class UpdateScheduleMessageReasonIdsQueryDto {
    @ApiProperty({ description: 'Reason id', type: Number })
    @IsNumber()
    reasonId: number;
}
