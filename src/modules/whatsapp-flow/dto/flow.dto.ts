import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsString, ValidateNested } from 'class-validator';

export class CreateFlowDto {
    @ApiProperty({
        description: 'O ID do channelConfig',
        type: String,
        example: '1ab2345c67d89e0123ab45c6',
    })
    @IsString()
    channelConfigId: string;

    @ApiProperty({
        description: 'O ID do flow library',
        type: Number,
        example: 42,
    })
    @IsInt()
    flowLibraryId: number;

    @ApiProperty({
        description: 'Os dados do fluxo',
        type: 'object',
        example: [{ key: 'value' }, { anotherKey: 'anotherValue' }],
    })
    @ValidateNested()
    @IsObject()
    @Type(() => Object)
    flowData: Record<string, any>;
}

export class UpdateFlowDataDto {
    @ApiProperty({
        description: 'Os dados do fluxo',
        type: 'object',
        example: [{ key: 'value' }, { anotherKey: 'anotherValue' }],
    })
    @ValidateNested()
    @IsObject()
    @Type(() => Object)
    flowData: Record<string, any>;
}

export class PublishFlowDto {
    @ApiProperty({
        description: 'O ID do channelConfig',
        type: String,
        example: '1ab2345c67d89e0123ab45c6',
    })
    @IsString()
    channelConfigId: string;

    @ApiProperty({
        description: 'O ID do flow',
        type: Number,
        example: 42,
    })
    @IsInt()
    flowId: number;
}

export class ActiveFlowDto {
    @ApiProperty({
        description: 'O ID do channelConfig',
        type: String,
        example: '1ab2345c67d89e0123ab45c6',
    })
    @IsString()
    channelConfigId: string;

    @ApiProperty({
        description: 'O ID do flow',
        type: Number,
        example: 42,
    })
    @IsInt()
    flowId: number;
}

export class DeactiveFlowDto {
    @ApiProperty({
        description: 'O ID do channelConfig',
        type: String,
        example: '1ab2345c67d89e0123ab45c6',
    })
    @IsString()
    channelConfigId: string;

    @ApiProperty({
        description: 'O ID do flow',
        type: Number,
        example: 42,
    })
    @IsInt()
    flowId: number;
}
