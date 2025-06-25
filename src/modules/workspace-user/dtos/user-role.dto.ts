import { ApiProperty } from '@nestjs/swagger';
import { UserRoles, PermissionResources } from './../../users/interfaces/user.interface';

export class CreateUserRoleRequest{
    @ApiProperty({enum: Object.keys(UserRoles)})
    role: UserRoles;

    @ApiProperty()
    resourceId: string;

    @ApiProperty()
    resource: PermissionResources;
}