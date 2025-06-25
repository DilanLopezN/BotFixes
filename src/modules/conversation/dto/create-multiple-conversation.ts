import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsArray, ArrayMinSize, ArrayMaxSize, ArrayUnique } from 'class-validator';

export class StartMember {
    @ApiProperty({ type: String, required: true })
    @IsString()
    phone: string;

    @ApiProperty({ type: String, required: false })
    @IsString()
    name?: string;

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    annotation?: string;
}

export class CreateMultipleConversation {
    @ApiProperty({
        type: StartMember,
        example: [
            {
                phone: '5548912233445',
                name: 'José',
                observation: 'Cancelado por mudança na agenda do médico',
            },
        ],
        isArray: true,
        required: true,
        minItems: 1,
        maxItems: 30,
        uniqueItems: true,
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(30)
    @ArrayUnique<StartMember>((member) => member.phone)
    @Type(() => StartMember)
    startMemberList: StartMember[];

    @ApiProperty({ type: String, required: true })
    @IsString()
    channelConfigId: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    assignedToTeamId: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    templateId: string;

    @ApiProperty({ type: Boolean, required: true })
    @IsBoolean()
    shouldCloseConversation: boolean;
}
