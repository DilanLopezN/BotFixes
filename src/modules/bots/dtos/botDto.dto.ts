import { IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PublishDisabled } from '../interfaces/bot.interface';

export class Language {
    @ApiProperty()
    @IsString()
    lang: string;

    @ApiProperty()
    @IsString()
    flag: string;
}

export class BotLabelColorDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    hexColor: string;
}

export class BotLabelDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    color: BotLabelColorDto;
}

export class BotDto {
    @ApiProperty()
    @IsString()
    readonly name: string;

    @ApiProperty()
    @IsString()
    readonly workspaceId: string;

    @ApiProperty()
    readonly params: any;

    @ApiProperty({
        type: Language,
        isArray: true,
    })
    @ValidateNested({
        each: true,
    })
    readonly languages: Language[];

    @ApiProperty()
    readonly organizationId: string;

    @ApiProperty({ required: false })
    readonly labels: Array<BotLabelDto>;

    @ApiProperty()
    readonly publishDisabled?: PublishDisabled;

    @ApiProperty()
    readonly updatedAt?: Number;

    @ApiProperty()
    readonly publishedAt?: Number;
}
