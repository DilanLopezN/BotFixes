import { ApiProperty } from '@nestjs/swagger';

export class ParameterDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    typeId?: string;

    @ApiProperty()
    mandatory? : boolean;

    @ApiProperty()
    defaultValue? : any;

    @ApiProperty()
    value? : any;
}
