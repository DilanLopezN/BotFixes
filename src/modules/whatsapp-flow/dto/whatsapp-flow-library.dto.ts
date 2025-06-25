import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsInt, ValidateNested, ArrayNotEmpty, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowVariable } from '../interfaces/flow.interface';

class TemplateMessageDto {
    @ApiProperty({ description: 'Exemplo de mensagem de template' })
    @IsString()
    message: string;
}

export class WhatsappFlowLibraryDto {
    @ApiProperty({ description: 'Nome da biblioteca de fluxo' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Nome amigavel para flowData' })
    @IsString()
    friendlyName: string;

    @ApiProperty({
        description: 'Lista de IDs de categorias de fluxo',
        type: [Number],
    })
    @IsArray()
    @ArrayNotEmpty({ message: 'A lista de flowCategoryIds não pode estar vazia.' })
    @IsInt({ each: true })
    flowCategoryIds: number[];

    @ApiProperty({
        description: 'Objeto JSON contendo dados do fluxo',
        type: 'object',
    })
    @ValidateNested()
    @IsObject()
    @Type(() => Object)
    flowJSON: Record<string, any>;

    @ApiProperty({
        description:
            'Objeto JSON contendo dados para busca do preview de flow (channelconfigId, flowId = ID do flow na meta)',
        type: 'object',
    })
    @ValidateNested()
    @IsOptional()
    @IsObject()
    @Type(() => Object)
    flowPreviewData?: Record<string, any>;

    @ApiProperty({
        description: 'Objeto JSON contendo dados da resposta do fluxo',
        type: 'object',
    })
    @ValidateNested()
    @IsObject()
    @Type(() => Object)
    flowFields: Record<string, any>;

    @ApiProperty({
        description: 'Lista de chaves do objeto data no FlowData',
        type: Object,
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    variablesOfFlowData?: FlowVariable[];

    @ApiProperty({
        description: 'Dados opcionais para a mensagem do template',
        type: TemplateMessageDto,
        required: false,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => TemplateMessageDto)
    templateMessageData?: TemplateMessageDto;
}
