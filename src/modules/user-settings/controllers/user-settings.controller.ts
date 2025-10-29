import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PredefinedRoles } from '../../../common/utils/utils';
import { UserDecorator } from '../../../decorators/user.decorator';
import { User as UserInterface } from '../../../modules/users/interfaces/user.interface';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CreateUserSettingsDto } from '../dto/create-user-settings.dto';
import { DeleteUserSettingsDto } from '../dto/delete-user-settings.dto';
import { FindUserSettingsDto } from '../dto/find-user-settings.dto';
import { UpdateUserSettingsBodyDto } from '../dto/update-user-settings-body.dto';
import { UserSettingsService } from '../services/user-settings.service';

@Controller('workspaces/:workspaceId/userSettings')
@UseGuards(AuthGuard)
@ApiTags('User Settings')
export class UserSettingsController {
    constructor(private userSettingsService: UserSettingsService) {}

    @Post('findUserSettings')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Carregar customizações do usuário logado por tipo' })
    @ApiParam({ name: 'workspaceId', type: String, required: true })
    @ApiResponse({ status: 200, description: 'Lista de configurações do usuário' })
    async findUserSettings(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) body: FindUserSettingsDto,
        @UserDecorator() user: UserInterface,
    ) {
        return this.userSettingsService.findByUserAndType(workspaceId, user._id.toString(), body.type);
    }

    @Post('createUserSettings')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Salvar customização do usuário logado' })
    @ApiParam({ name: 'workspaceId', type: String, required: true })
    @ApiResponse({ status: 201, description: 'Configuração criada com sucesso' })
    @ApiResponse({ status: 409, description: 'Configuração já existe para esta key e type' })
    async createUserSettings(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) createDto: CreateUserSettingsDto,
        @UserDecorator() user: UserInterface,
    ) {
        return this.userSettingsService.create(workspaceId, user._id.toString(), createDto);
    }

    @Post('updateUserSettings')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Atualizar customização do usuário logado' })
    @ApiParam({ name: 'workspaceId', type: String, required: true })
    @ApiResponse({ status: 200, description: 'Configuração atualizada com sucesso' })
    @ApiResponse({ status: 404, description: 'Configuração não encontrada' })
    async updateUserSettings(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) updateDto: UpdateUserSettingsBodyDto,
        @UserDecorator() user: UserInterface,
    ) {
        return this.userSettingsService.update(workspaceId, user._id.toString(), updateDto.type, updateDto.key, {
            value: updateDto.value,
            label: updateDto.label,
        });
    }

    @Post('deleteUserSettings')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Deletar customização do usuário logado' })
    @ApiParam({ name: 'workspaceId', type: String, required: true })
    @ApiResponse({ status: 204, description: 'Configuração deletada com sucesso' })
    @ApiResponse({ status: 404, description: 'Configuração não encontrada' })
    async deleteUserSettings(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) deleteDto: DeleteUserSettingsDto,
        @UserDecorator() user: UserInterface,
    ) {
        await this.userSettingsService.delete(workspaceId, user._id.toString(), deleteDto.type, deleteDto.key);
    }
}
