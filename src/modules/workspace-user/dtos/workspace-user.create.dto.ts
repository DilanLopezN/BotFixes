import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { PermissionResources, UserLanguage, UserRoles } from 'kissbot-core';

class RoleDto {
    @ApiProperty({ enum: PermissionResources })
    @IsEnum(PermissionResources)
    @IsNotEmpty()
    resource: PermissionResources;

    @ApiProperty()
    @IsOptional()
    resourceId: string;

    @ApiProperty({ enum: UserRoles })
    @IsEnum(UserRoles)
    @IsNotEmpty()
    role: UserRoles;
}

export class CreateWorkspaceUserDTO {
    @ApiProperty({
        description: 'Workspace User Name',
        type: String,
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    readonly name: string;

    @ApiProperty({
        description: 'Workspace User E-mail',
        type: String,
        required: true,
    })
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @ApiProperty({
        description: 'Workspace User Password',
        type: String,
        required: true,
    })
    @MinLength(8)
    @MaxLength(20)
    @Matches(/[!@#$%^&*()?":{}|<>+]/, { message: 'password too weak - must have at least one special character' })
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        description: 'Workspace User Role',
        type: RoleDto,
        required: false,
    })
    @ValidateNested()
    @Type(() => RoleDto)
    // @IsNotEmpty()
    @IsOptional()
    role?: RoleDto;

    @ApiProperty({
        description: 'Workspace User Avatar',
        type: String,
        required: false,
    })
    @IsString()
    @IsOptional()
    readonly avatar?: string;

    @ApiProperty({
        description: 'Workspace User Language',
        enum: UserLanguage,
        required: false,
    })
    @IsEnum(UserLanguage)
    // @IsNotEmpty()
    @IsOptional()
    readonly language?: UserLanguage;

    @ApiProperty({
        description: 'Workspace User Password Expiration Time',
        type: Number,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    readonly passwordExpires?: number;

    @ApiProperty({
        description: 'Workspace User Timezone',
        type: String,
        required: false,
    })
    @IsString()
    @IsOptional()
    readonly timezone?: string;

    @ApiProperty({
        description: 'Workspace ERP User',
        type: String,
        required: false,
    })
    @IsString()
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    readonly erpUsername?: string;
}
