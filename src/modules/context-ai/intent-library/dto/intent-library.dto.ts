import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateIntentLibraryDto {
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
}

export class UpdateIntentLibraryDto {
    @IsUUID()
    @IsNotEmpty()
    intentLibraryId: string;

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
}

export class DeleteIntentLibraryDto {
    @IsUUID()
    @IsNotEmpty()
    intentLibraryId: string;
}

export class GetIntentLibraryDto {
    @IsUUID()
    @IsNotEmpty()
    intentLibraryId: string;
}

export class ListIntentLibraryDto {
    @IsString()
    @IsOptional()
    search?: string;
}
