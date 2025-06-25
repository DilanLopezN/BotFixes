import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRunnerDto {
    @IsString()
    @MaxLength(200)
    name: string;
}

export class UpdateRunnerDto extends CreateRunnerDto {
    @IsNumber()
    id: number;

    @IsOptional()
    createdAt: Date;
}
