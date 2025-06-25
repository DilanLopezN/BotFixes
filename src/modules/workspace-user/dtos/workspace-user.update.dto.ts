import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateWorkspaceUserDTO } from './workspace-user.create.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleDto } from '../../users/dtos/user.dto';

export class UpdateWorkspaceUserDTO extends PartialType(OmitType(CreateWorkspaceUserDTO, ['email', 'password'])) {
    @ApiProperty({
        description: 'Workspace User Role',
        type: RoleDto,
        isArray: true,
        required: false,
    })
    @ValidateNested()
    @Type(() => RoleDto)
    @IsOptional()
    subRoles?: RoleDto[];
}
