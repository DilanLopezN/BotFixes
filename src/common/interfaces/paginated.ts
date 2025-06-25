import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export interface PaginatedModel<Model> {
    count: number;
    currentPage: number;
    nextPage: number;
    data: Array<Model>;
}

export class PaginatedModelDto<Model> {
    @ApiProperty({ nullable: true })
    @IsNumber()
    count: number;

    @ApiProperty({ nullable: true })
    @IsNumber()
    currentPage: number | null;

    @ApiProperty({ nullable: true })
    @IsNumber()
    nextPage: number | null;

    @ApiProperty({ isArray: true })
    data: Array<Model>;
}
