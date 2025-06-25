import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDto extends UserDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly workspaceId: string;
}
