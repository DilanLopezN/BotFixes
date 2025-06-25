import { ApiProperty } from '@nestjs/swagger';
import { InteractionType } from '../interfaces/response.interface';
import { ParameterDto } from './ParameterDto.dto';
import { LanguageInteractionDto } from './language.dto';
export class CommentDto {
    @ApiProperty()
    comment: string;

    @ApiProperty({required: false})
    userId?: string;
}

export class InteractionDto {
    @ApiProperty()
    readonly name: string;

    @ApiProperty()
    readonly action: string;

    @ApiProperty()
    readonly description: string;

    @ApiProperty()
    readonly workspaceId: string;

    @ApiProperty()
    readonly botId: string;

    @ApiProperty()
    readonly parentId?: string;

    @ApiProperty()
    readonly isCollapsed: Boolean;

    @ApiProperty()
    readonly position: Number;

    @ApiProperty({
        type: String,
        enum: [
            InteractionType.container,
            InteractionType.contextFallback,
            InteractionType.fallback,
            InteractionType.interaction,
            InteractionType.welcome,
        ],
    })

    readonly type: InteractionType;

    @ApiProperty({ type: ParameterDto, isArray: true })
    readonly parameters: ParameterDto[];

    @ApiProperty({ type: CommentDto, isArray: true })
    readonly comments: CommentDto[];

    @ApiProperty({ type: LanguageInteractionDto, isArray: true })
    readonly languages: LanguageInteractionDto[];

    @ApiProperty({ type: String, isArray: true })
    readonly path: string[];

    @ApiProperty({ type: String, isArray: true })
    readonly completePath: string[];

    @ApiProperty({ type: String, isArray: true })
    readonly labels: string[];

    @ApiProperty({ type: String, isArray: true })
    readonly triggers: string[];

    @ApiProperty()
    readonly params: any;

    @ApiProperty({ type: String, isArray: true })
    readonly reference: any;

    @ApiProperty({
        required: false,
        isArray: true,
        format: 'string',
        example: ['interaction_id_1', 'interaction_id_2'],
    })
    readonly children: any[];
}
