import { IsString, ValidateIf, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerXSettings, GeneralConfigs } from '../interfaces/workspace.interface';

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
    readonly customerXSettings?: CustomerXSettings;
}