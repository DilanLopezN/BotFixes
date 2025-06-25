import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsArray,
    IsOptional,
    IsEnum,
    IsEmail,
    IsDateString,
    IsNotEmpty,
    ValidateNested,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class Contact {
    @ApiProperty({
        description: 'Lista de números de telefone do contato',
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    phone: string[];

    @ApiProperty({
        description: 'Endereço de e-mail do contato, pode ser nulo',
        required: false,
    })
    @IsOptional()
    @IsEmail()
    email: string | null;

    @ApiProperty({
        description: 'Nome do contato',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Código único do contato',
    })
    @IsString()
    @IsNotEmpty()
    code: string;
}

class Schedule {
    @ApiProperty({
        description: 'Código do agendamento',
    })
    @IsString()
    @IsNotEmpty()
    scheduleCode: string;

    @ApiProperty({
        description: 'Data do agendamento no formato ISO',
    })
    @IsDateString()
    scheduleDate: string;

    @ApiProperty({
        description: 'Endereço da unidade organizacional, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    organizationUnitAddress?: string;

    @ApiProperty({
        description: 'Nome da unidade organizacional, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    organizationUnitName?: string;

    @ApiProperty({
        description: 'Nome do procedimento, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    procedureName?: string;

    @ApiProperty({
        description: 'Nome da especialidade, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    specialityName?: string;

    @ApiProperty({
        description: 'Nome do médico, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    doctorName?: string;

    @ApiProperty({
        description: 'Observações do médico, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    doctorObservation?: string | null;

    @ApiProperty({
        description: 'Código de agendamento principal, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    principalScheduleCode?: string;

    @ApiProperty({
        description: 'Se é o agendamento principal, opcional',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isPrincipal?: boolean;

    @ApiProperty({
        description: 'Nome do tipo de agendamento, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    appointmentTypeName?: string;

    @ApiProperty({
        description: 'Se o agendamento é de primeira vez, opcional',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isFirstComeFirstServed?: boolean;

    @ApiProperty({
        description: 'Código do tipo de agendamento, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    appointmentTypeCode?: string;

    @ApiProperty({
        description: 'Código do médico, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    doctorCode?: string;

    @ApiProperty({
        description: 'Código da unidade organizacional, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    organizationUnitCode?: string;

    @ApiProperty({
        description: 'Código do procedimento, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    procedureCode?: string;

    @ApiProperty({
        description: 'Código da especialidade, opcional',
        required: false,
    })
    @IsOptional()
    @IsString()
    specialityCode?: string;

    @ApiProperty({
        description: 'Dados adicionais relacionados ao agendamento',
        type: Object,
    })
    @IsOptional()
    data?: Record<string, unknown>;
}

export class SendScheduleDto {
    @ApiProperty({
        description: 'Informações de contato do paciente',
        type: Contact,
    })
    @ValidateNested()
    @Type(() => Contact)
    contact: Contact;

    @ApiProperty({
        description: 'Informações do agendamento',
        type: Schedule,
    })
    @ValidateNested()
    @Type(() => Schedule)
    schedule: Schedule;

    @ApiProperty({
        description: 'Chave da API para autenticação',
    })
    @IsString()
    @IsNotEmpty()
    apiKey: string;

    @ApiProperty({
        description: 'Tipo de envio (ex: confirmação, lembrete, notificação...)',
    })
    @IsNotEmpty()
    sendType: string;
}
