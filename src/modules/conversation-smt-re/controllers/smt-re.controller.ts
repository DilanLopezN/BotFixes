import {
    Controller,
    Get,
    Param,
    UseGuards,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { SmtReService } from '../services/smt-re.service';
import { SmtRe } from '../models/smt-re.entity';

@ApiTags('SMT-RE')
@Controller('workspaces')
@UseGuards(AuthGuard, RolesGuard)
export class SmtReController {
    constructor(private readonly smtReService: SmtReService) {}

    @Get('/:workspaceId/smt-re/:id')
    @ApiOperation({ summary: 'Buscar SMT-RE por ID' })
    @ApiParam({
        name: 'workspaceId',
        description: 'ID do workspace',
        type: 'string',
    })
    @ApiParam({
        name: 'id',
        description: 'ID do SMT-RE',
        type: 'string',
    })
    @ApiResponse({
        status: 200,
        description: 'SMT-RE encontrado',
        type: SmtRe,
    })
    @ApiResponse({
        status: 404,
        description: 'SMT-RE não encontrado',
    })
    @ApiResponse({
        status: 401,
        description: 'Não autorizado',
    })
    @RolesDecorator([PredefinedRoles.WORKSPACE_ADMIN, PredefinedRoles.SYSTEM_ADMIN])
    async findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string): Promise<SmtRe> {
        const smtRe = await this.smtReService.findById(id);
        if (!smtRe || smtRe.workspaceId !== workspaceId) {
            throw new NotFoundException(`SmtRe with id ${id} not found in workspace ${workspaceId}`);
        }
        return smtRe;
    }
}