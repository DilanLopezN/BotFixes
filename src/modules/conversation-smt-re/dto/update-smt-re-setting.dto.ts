import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSmtReSettingDto {
    @ApiProperty({
        description: 'Tempo de espera inicial em minutos',
        example: 5,
        minimum: 1,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    initialWaitTime?: number;

    @ApiProperty({
        description: 'Se deve ou não reativar automaticamente quando o agente manda uma mensagem',
    })
    @IsBoolean()
    automaticReactivate: boolean;

    @ApiProperty({
        description: 'Mensagem inicial a ser enviada',
        example: 'Olá! Em que posso ajudá-lo hoje?',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    initialMessage?: string;

    @ApiProperty({
        description: 'Tempo de espera para mensagem automática em minutos',
        example: 10,
        minimum: 1,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    automaticWaitTime?: number;

    @ApiProperty({
        description: 'Mensagem automática a ser enviada',
        example: 'Ainda precisa de ajuda? Nossa equipe está aqui para auxiliar.',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    automaticMessage?: string;

    @ApiProperty({
        description: 'Tempo de espera para finalização em minutos',
        example: 15,
        minimum: 1,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    finalizationWaitTime?: number;

    @ApiProperty({
        description: 'Mensagem de finalização a ser enviada',
        example: 'Obrigado por entrar em contato. Tenha um ótimo dia!',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    finalizationMessage?: string;

    @ApiProperty({
        description: 'Nome da configuração',
        example: 'Configuração Padrão',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @ApiProperty({
        description: 'Lista de IDs dos times',
        example: ['team-id-1', 'team-id-2'],
        type: [String],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    teamIds?: string[];

    @ApiProperty({
        description: 'ID do objetivo para categorização automática',
        example: 1,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    objectiveId?: number;

    @ApiProperty({
        description: 'ID do desfecho para categorização automática',
        example: 2,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    outcomeId?: number;

    @ApiProperty({
        description: 'Se a configuração está ativa',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
