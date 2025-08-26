import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateIf } from 'class-validator';
import {
    AdvancedModuleFeatures,
    CustomerXSettings,
    FeatureFlag,
    GeneralConfigs,
} from '../interfaces/workspace.interface';

export class WorkspaceSeetingsDto {
    @ApiProperty()
    dialogflowEnabled: boolean;

    @ApiProperty()
    dialogflowWritable: boolean;

    @ApiProperty()
    dialogflowTemplate: boolean;
}

export class DialogflowAccountSchemaDto {
    @ApiProperty()
    type: string;

    @ApiProperty()
    project_id: string;

    @ApiProperty()
    private_key_id: string;

    @ApiProperty()
    private_key: string;

    @ApiProperty()
    client_email: string;

    @ApiProperty()
    client_id: string;
}

export class WorkspaceDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    @ValidateIf((workspace: WorkspaceDto) => !!workspace.organizationId)
    readonly organizationId?: string;

    @ApiProperty({ required: false })
    @ValidateIf((workspace: WorkspaceDto) => !!workspace.description)
    readonly description?: string;

    @ApiProperty({ required: false })
    readonly settings?: WorkspaceSeetingsDto;

    @ApiProperty({ required: false })
    readonly dialogFlowAccount?: DialogflowAccountSchemaDto;

    @ApiProperty({ required: false })
    readonly generalConfigs?: GeneralConfigs;

    @ApiProperty({ required: false })
    readonly featureFlag?: FeatureFlag;

    @ApiProperty({ required: false })
    readonly customerXSettings?: CustomerXSettings;
}

export class UpdateWorkspaceFlagsDto {
    @ApiProperty({
        description: 'Flags para habilitar/desabilitar funcionalidades. Pode conter quaisquer chaves.',
        type: 'object',
        example: { newFeatureToggle: true, anotherFlag: false },
        required: false,
    })
    @IsOptional()
    @IsObject({ message: 'featureFlag deve ser um objeto de configurações.' })
    featureFlag?: Record<string, any>;

    @ApiProperty({
        description: 'Configurações gerais do workspace. Pode conter quaisquer chaves.',
        type: 'object',
        example: { newConfig: 'value', itemsPerPage: 50 },
        required: false,
    })
    @IsOptional()
    @IsObject({ message: 'generalConfigs deve ser um objeto de configurações.' })
    generalConfigs?: Record<string, any>;
}

export class UpdateWorkspaceAdvancedModuleFeaturesDto {
    @ApiProperty({ required: false })
    readonly advancedModuleFeatures?: AdvancedModuleFeatures;
}
