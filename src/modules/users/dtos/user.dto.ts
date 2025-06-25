import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRoles } from '../interfaces/user.interface';
import { PermissionResources } from 'kissbot-core';

export enum UserLanguage {
    pt = 'pt',
    en = 'en',
    es = 'es',
}

export class UserDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly email: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly avatar?: string;

    @ApiProperty()
    @IsEnum(UserLanguage)
    @IsOptional()
    readonly language: UserLanguage;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    readonly passwordExpires: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly timezone: string;

    @ApiProperty()
    @IsOptional()
    readonly liveAgentParams?: {
        notifications?: {
            emitSoundNotifications?: boolean;
            notificationNewAttendance?: boolean;
        }
    }
}

export class RoleDto {
    @ApiProperty({ enum: PermissionResources })
    resource: PermissionResources;

    @ApiProperty()
    resourceId: string;
    
    @ApiProperty({ enum: UserRoles })
    role: UserRoles;
}
export class CreateUserDto extends UserDto {
    @ApiProperty()
    @MinLength(8)
    @MaxLength(20)
    password: string;

    @ApiProperty()
    @IsOptional()
    role: RoleDto;
}

