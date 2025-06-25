import { IsArray, IsBoolean, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { ContactAutoAssign } from '../models/contact-auto-assign.entity';
import { Type } from 'class-transformer';

export class UpdateAutoAssignContactDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsString()
    @MaxLength(15)
    phone: number;
}

export class UpdateAutoAssignDto {
    @IsString()
    @MaxLength(255)
    @MinLength(3)
    name: string;

    @IsString()
    teamId: string;

    @IsString({ each: true })
    channelConfigIds: string[];

    @IsBoolean()
    enableRating: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateAutoAssignContactDto)
    contacts?: ContactAutoAssign[];
}
