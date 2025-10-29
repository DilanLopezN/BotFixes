import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { IntentDetectionService } from '../services/intent-detection.service';
import {
    CreateIntentDetectionDto,
    UpdateIntentDetectionDto,
    ListIntentDetectionDto,
    DetectIntentDto,
    DeleteIntentDetectionDto,
    GetIntentDetectionDto,
    ListIntentDetectionByAgentDto,
    ImportIntentDetectionFromLibraryDto,
} from '../dto/intent-detection.dto';
import { ListIntentDetectionUserHistoryDto } from '../dto/intent-detection-user-history.dto';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { RoleData, RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { IIntentDetection } from '../interfaces/intent-detection.interface';
import { IIntentDetectionUserHistory } from '../interfaces/intent-detection-user-history.interface';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

@ApiTags('Intent Detection')
@Controller('workspaces/:workspaceId/conversation-ai/intent-detection')
export class IntentDetectionController {
    constructor(private readonly intentDetectionService: IntentDetectionService) {}

    @HttpCode(HttpStatus.OK)
    @Post('createIntentDetection')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async createIntentDetection(
        @Body(new ValidationPipe()) dto: CreateIntentDetectionDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IIntentDetection>> {
        const createData = {
            ...dto,
            workspaceId,
        };
        const intentDetection = await this.intentDetectionService.create(createData);
        return { data: intentDetection };
    }

    @HttpCode(HttpStatus.OK)
    @Post('updateIntentDetection')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async updateIntentDetection(
        @Body(new ValidationPipe()) dto: UpdateIntentDetectionDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IIntentDetection>> {
        const updateData = {
            ...dto,
            workspaceId,
        };
        const intentDetection = await this.intentDetectionService.update(updateData);
        return { data: intentDetection };
    }

    @HttpCode(HttpStatus.OK)
    @Post('deleteIntentDetection')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async deleteIntentDetection(
        @Body(new ValidationPipe()) dto: DeleteIntentDetectionDto,
    ): Promise<DefaultResponse<{ ok: boolean }>> {
        const result = await this.intentDetectionService.delete(dto);
        return { data: result };
    }

    @HttpCode(HttpStatus.OK)
    @Post('getIntentDetection')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getIntentDetectionById(
        @Body(new ValidationPipe()) dto: GetIntentDetectionDto,
    ): Promise<DefaultResponse<IIntentDetection>> {
        const intentDetection = await this.intentDetectionService.findById(dto.intentDetectionId);
        return { data: intentDetection };
    }

    @HttpCode(HttpStatus.OK)
    @Post('listIntentDetection')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listIntentDetection(
        @Body(new ValidationPipe()) dto: ListIntentDetectionDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IIntentDetection[]>> {
        const filterData = {
            ...dto,
            workspaceId,
        };
        const intentDetection = await this.intentDetectionService.list(filterData);
        return { data: intentDetection };
    }

    @HttpCode(HttpStatus.OK)
    @Post('listIntentDetectionByAgent')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listIntentDetectionByAgent(
        @Body(new ValidationPipe()) dto: ListIntentDetectionByAgentDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IIntentDetection[]>> {
        const intentDetection = await this.intentDetectionService.findByAgentId(workspaceId, dto.agentId);
        return { data: intentDetection };
    }

    @HttpCode(HttpStatus.OK)
    @Post('importIntentFromLibrary')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async importIntentFromLibrary(
        @Body(new ValidationPipe()) dto: ImportIntentDetectionFromLibraryDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IIntentDetection>> {
        const intentDetection = await this.intentDetectionService.importFromLibrary({
            intentLibraryId: dto.intentLibraryId,
            agentId: dto.agentId,
            workspaceId,
        });
        return { data: intentDetection };
    }

    @HttpCode(HttpStatus.OK)
    @Post('detectIntent')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async detectIntent(
        @Body(new ValidationPipe()) dto: DetectIntentDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<
        DefaultResponse<{
            intent: { id: string; name: string } | null;
            actions: { id: string; actionType: string; targetValue: string }[];
            interaction: any;
            tokens: number;
        }>
    > {
        const result = await this.intentDetectionService.detectIntentWithAI(
            dto.text,
            workspaceId,
            dto.agentId,
            dto.contextId,
            dto.fromInteractionId,
        );
        return { data: result };
    }

    @HttpCode(HttpStatus.OK)
    @Post('listDetectionUserHistory')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listDetectionUserHistory(
        @Body(new ValidationPipe()) dto: ListIntentDetectionUserHistoryDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IIntentDetectionUserHistory[]>> {
        const filterData = {
            ...dto,
            workspaceId,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        };
        const history = await this.intentDetectionService.listDetectionUserHistory(filterData);
        return { data: history };
    }
}
