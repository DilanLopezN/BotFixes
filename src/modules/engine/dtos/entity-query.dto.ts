import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class EntityQueryDto{
    @ApiProperty({description: "Entity name"})
    @IsString()
    @IsNotEmpty()
    entityName: string;

    @ApiProperty()
    entryName: string;
}