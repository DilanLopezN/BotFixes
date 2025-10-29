import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { RoleData, RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { IntentLibraryService } from '../services/intent-library.service';
import {
    CreateIntentLibraryDto,
    DeleteIntentLibraryDto,
    GetIntentLibraryDto,
    ListIntentLibraryDto,
    UpdateIntentLibraryDto,
} from '../dto/intent-library.dto';
import { IIntentLibrary } from '../interfaces/intent-library.interface';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

@ApiTags('Intent Library')
@Controller('workspaces/:workspaceId/conversation-ai/intent-library')
export class IntentLibraryController {
    constructor(private readonly intentLibraryService: IntentLibraryService) {}

    @HttpCode(HttpStatus.OK)
    @Post('createIntentLibrary')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async createIntentLibrary(
        @Body(new ValidationPipe()) dto: CreateIntentLibraryDto,
        @Param('workspaceId') _workspaceId: string,
    ): Promise<DefaultResponse<IIntentLibrary>> {
        const intentLibrary = await this.intentLibraryService.create(dto);
        return { data: intentLibrary };
    }

    @HttpCode(HttpStatus.OK)
    @Post('updateIntentLibrary')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async updateIntentLibrary(
        @Body(new ValidationPipe()) dto: UpdateIntentLibraryDto,
        @Param('workspaceId') _workspaceId: string,
    ): Promise<DefaultResponse<IIntentLibrary>> {
        const intentLibrary = await this.intentLibraryService.update(dto);
        return { data: intentLibrary };
    }

    @HttpCode(HttpStatus.OK)
    @Post('deleteIntentLibrary')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async deleteIntentLibrary(
        @Body(new ValidationPipe()) dto: DeleteIntentLibraryDto,
    ): Promise<DefaultResponse<{ ok: boolean }>> {
        const result = await this.intentLibraryService.delete(dto);
        return { data: result };
    }

    @HttpCode(HttpStatus.OK)
    @Post('getIntentLibrary')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getIntentLibrary(
        @Body(new ValidationPipe()) dto: GetIntentLibraryDto,
    ): Promise<DefaultResponse<IIntentLibrary>> {
        const intentLibrary = await this.intentLibraryService.findById(dto.intentLibraryId);
        return { data: intentLibrary };
    }

    @HttpCode(HttpStatus.OK)
    @Post('listIntentLibrary')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listIntentLibrary(
        @Body(new ValidationPipe()) dto: ListIntentLibraryDto,
        @Param('workspaceId') _workspaceId: string,
    ): Promise<DefaultResponse<IIntentLibrary[]>> {
        const intentLibrary = await this.intentLibraryService.list(dto);
        return { data: intentLibrary };
    }
}
