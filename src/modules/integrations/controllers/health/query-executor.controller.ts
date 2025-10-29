import { Controller, Post, Body, ValidationPipe, UseGuards, Param } from '@nestjs/common';
import { IsString, IsNumber, IsNotEmpty, Matches, Min, Max } from 'class-validator';
import { AuthGuard } from '../../../../modules/auth/guard/auth.guard';
import { RolesGuard } from '../../../../modules/users/guards/roles.guard';
import { RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { QueryExecutorService } from '../../services/health/query-executor.service';

class DoctorStatusDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]+$/, { message: 'doctorCode deve conter apenas números' })
    doctorCode: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]+$/, { message: 'insuranceCode deve conter apenas números' })
    insuranceCode: string;

    @IsNumber()
    @Min(0, { message: 'age deve ser um número positivo' })
    @Max(150, { message: 'age deve ser menor que 150' })
    age: number;
}

@UseGuards(AuthGuard, RolesGuard)
@Controller('integrations/:integratonId/query')
export class QueryExecutorController {
    constructor(private readonly queryExecutorService: QueryExecutorService) {}

    @Post('doctor/status')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_SUPPORT_ADMIN,
    ])
    async getDoctorStatus(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: DoctorStatusDto,
        @Param('integratonId') integratonId: string,
    ) {
        const { doctorCode, insuranceCode, age } = body;

        try {
            const result = await this.queryExecutorService.getDoctorStatus(
                integratonId,
                doctorCode,
                insuranceCode,
                age,
            );
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
