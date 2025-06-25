import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseIntPipe,
    NotFoundException,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { SmtReSettingService } from '../services/smt-re-setting.service';
import { CreateSmtReSettingDto } from '../dto/create-smt-re-setting.dto';
import { UpdateSmtReSettingDto } from '../dto/update-smt-re-setting.dto';
import { SmtReSetting } from '../models/smt-re-setting.entity';

@ApiTags('SMT-RE Settings')
@Controller('workspaces')
@UseGuards(AuthGuard, RolesGuard)
export class SmtReSettingController {
    constructor(private readonly smtReSettingService: SmtReSettingService) {}

    @Post('/:workspaceId/smt-re-settings')
    @ApiOperation({ summary: 'Criar nova configuração SMT-RE' })
    @ApiParam({
        name: 'workspaceId',
        description: 'ID do workspace',
        type: 'string',
    })
    @ApiResponse({
        status: 201,
        description: 'Configuração SMT-RE criada com sucesso',
        type: SmtReSetting,
    })
    @ApiResponse({
        status: 400,
        description: 'Dados inválidos',
    })
    @ApiResponse({
        status: 401,
        description: 'Não autorizado',
    })
    @RolesDecorator([PredefinedRoles.WORKSPACE_ADMIN, PredefinedRoles.SYSTEM_ADMIN])
    async create(
        @Param('workspaceId') workspaceId: string,
        @Body() createDto: CreateSmtReSettingDto,
    ): Promise<SmtReSetting> {
        const data = {
            workspaceId,
            ...createDto,
        };
        return this.smtReSettingService.create(data);
    }

    @Get('/:workspaceId/smt-re-settings')
    @ApiOperation({ summary: 'Listar todas as configurações SMT-RE do workspace' })
    @ApiParam({
        name: 'workspaceId',
        description: 'ID do workspace',
        type: 'string',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de configurações SMT-RE',
        type: [SmtReSetting],
    })
    @ApiResponse({
        status: 401,
        description: 'Não autorizado',
    })
    @RolesDecorator([PredefinedRoles.WORKSPACE_ADMIN, PredefinedRoles.SYSTEM_ADMIN])
    async findAll(
        @Param('workspaceId') workspaceId: string,
        @Query('teamId') teamId?: string,
    ): Promise<SmtReSetting[]> {
        if (teamId) {
            return this.smtReSettingService.findByTeamId(workspaceId, teamId);
        }
        return this.smtReSettingService.findAllByWorkspaceId(workspaceId);
    }

    @Get('/:workspaceId/smt-re-settings/:id')
    @ApiOperation({ summary: 'Buscar configuração SMT-RE por ID' })
    @ApiParam({
        name: 'workspaceId',
        description: 'ID do workspace',
        type: 'string',
    })
    @ApiParam({
        name: 'id',
        description: 'ID da configuração SMT-RE',
        type: 'number',
    })
    @ApiResponse({
        status: 200,
        description: 'Configuração SMT-RE encontrada',
        type: SmtReSetting,
    })
    @ApiResponse({
        status: 404,
        description: 'Configuração SMT-RE não encontrada',
    })
    @ApiResponse({
        status: 401,
        description: 'Não autorizado',
    })
    @RolesDecorator([PredefinedRoles.WORKSPACE_ADMIN, PredefinedRoles.SYSTEM_ADMIN])
    async findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string): Promise<SmtReSetting> {
        const setting = await this.smtReSettingService.findById(id);
        if (!setting || setting.workspaceId !== workspaceId) {
            throw new NotFoundException(`SmtReSetting with id ${id} not found in workspace ${workspaceId}`);
        }
        return setting;
    }

    @Put('/:workspaceId/smt-re-settings/:id')
    @ApiOperation({ summary: 'Atualizar configuração SMT-RE' })
    @ApiParam({
        name: 'workspaceId',
        description: 'ID do workspace',
        type: 'string',
    })
    @ApiParam({
        name: 'id',
        description: 'ID da configuração SMT-RE',
        type: 'number',
    })
    @ApiResponse({
        status: 200,
        description: 'Configuração SMT-RE atualizada com sucesso',
        type: SmtReSetting,
    })
    @ApiResponse({
        status: 404,
        description: 'Configuração SMT-RE não encontrada',
    })
    @ApiResponse({
        status: 400,
        description: 'Dados inválidos',
    })
    @ApiResponse({
        status: 401,
        description: 'Não autorizado',
    })
    @RolesDecorator([PredefinedRoles.WORKSPACE_ADMIN, PredefinedRoles.SYSTEM_ADMIN])
    async update(
        @Param('workspaceId') workspaceId: string,
        @Param('id') id: string,
        @Body() updateDto: UpdateSmtReSettingDto,
    ): Promise<SmtReSetting> {
        const existingSetting = await this.smtReSettingService.findById(id);
        if (!existingSetting || existingSetting.workspaceId !== workspaceId) {
            throw new NotFoundException(`SmtReSetting with id ${id} not found in workspace ${workspaceId}`);
        }

        return this.smtReSettingService.update(id, updateDto);
    }

    @Delete('/:workspaceId/smt-re-settings/:id')
    @ApiOperation({ summary: 'Excluir configuração SMT-RE' })
    @ApiParam({
        name: 'workspaceId',
        description: 'ID do workspace',
        type: 'string',
    })
    @ApiParam({
        name: 'id',
        description: 'ID da configuração SMT-RE',
        type: 'number',
    })
    @ApiResponse({
        status: 204,
        description: 'Configuração SMT-RE excluída com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Configuração SMT-RE não encontrada',
    })
    @ApiResponse({
        status: 401,
        description: 'Não autorizado',
    })
    @RolesDecorator([PredefinedRoles.WORKSPACE_ADMIN, PredefinedRoles.SYSTEM_ADMIN])
    async remove(@Param('workspaceId') workspaceId: string, @Param('id') id: string): Promise<void> {
        return this.smtReSettingService.delete(id, workspaceId);
    }
}
