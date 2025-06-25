import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteContextVariableDto {
    @ApiProperty()
    @IsString()
    contextVariableId: string;
}
