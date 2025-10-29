import { IsString, IsArray, IsObject, IsOptional, ValidateNested, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AttributeDto {
    @ApiProperty({ example: 'name' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'John Doe' })
    @IsDefined()
    value: any;

    @ApiProperty({
        required: false,
        example: '@sys.string',
    })
    @IsOptional()
    @IsString()
    type?: string;
}

export class RecipientDto {
    @ApiProperty({ required: false, example: 'user@example.com' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ required: false, example: '5511999999999' })
    @IsOptional()
    @IsString()
    whatsapp?: string;

    @ApiProperty({ required: false, type: [AttributeDto] })
    @IsOptional()
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => AttributeDto)
    attributes?: AttributeDto[];
}

export class InitiateCampaignDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsString()
    campaignId: string;

    @ApiProperty({ type: [RecipientDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipientDto)
    recipients: RecipientDto[];

    @ApiProperty({
        required: false,
        description: 'Attributes to be used in the email template',
        type: [AttributeDto],
        example: [
            { name: 'subject', value: 'Welcome', type: '@sys.string' },
            { name: 'header', value: 'Hello!', type: '@sys.string' },
        ],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttributeDto)
    templateAttributes?: AttributeDto[];

    @ApiProperty({
        required: false,
        description: 'Attributes to be added to the conversation when created',
        type: [AttributeDto],
        example: [
            { name: 'campaign', value: 'summer-2024', type: '@sys.string' },
            { name: 'source', value: 'email', type: '@sys.string' },
        ],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttributeDto)
    conversationAttributes?: AttributeDto[];

    requestId?: string;
}
