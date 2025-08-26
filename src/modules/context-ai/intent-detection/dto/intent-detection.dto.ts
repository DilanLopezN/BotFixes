import { IsString, IsArray, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateIntentDetectionDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    examples: string[];

    @IsUUID()
    @IsNotEmpty()
    agentId: string;
}

export class UpdateIntentDetectionDto {
    @IsUUID()
    @IsNotEmpty()
    intentDetectionId: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    examples?: string[];

    @IsUUID()
    @IsOptional()
    agentId?: string;
}

export class DeleteIntentDetectionDto {
    @IsUUID()
    @IsNotEmpty()
    intentDetectionId: string;
}

export class GetIntentDetectionDto {
    @IsUUID()
    @IsNotEmpty()
    intentDetectionId: string;
}

export class ListIntentDetectionByAgentDto {
    @IsUUID()
    @IsNotEmpty()
    agentId: string;
}

export class ListIntentDetectionDto {
    @IsUUID()
    @IsNotEmpty()
    agentId: string;
}

export class DetectIntentDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsUUID()
    @IsOptional()
    agentId?: string;

    @IsString()
    @IsOptional()
    contextId?: string;

    @IsString()
    @IsOptional()
    fromInteractionId?: string;
}
