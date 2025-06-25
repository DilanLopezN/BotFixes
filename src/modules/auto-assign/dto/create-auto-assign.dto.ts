import { IsArray, IsString, MaxLength, MinLength, ValidateNested, IsBoolean } from 'class-validator';
import { ContactAutoAssign } from '../models/contact-auto-assign.entity';
import { Type } from 'class-transformer';

export class CreateAutoAssignContactDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsString()
    @MaxLength(15)
    phone: number;
}

export class CreateAutoAssignDto {
    @IsString()
    @MaxLength(255)
    @MinLength(3)
    name: string;

    @IsString()
    teamId: string;

    @IsString({ each: true })
    channelConfigIds: string[];

    @IsString()
    workspaceId: string;

    @IsBoolean()
    enableRating: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAutoAssignContactDto)
    contacts?: ContactAutoAssign[];
}
