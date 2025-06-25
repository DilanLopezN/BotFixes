import { Controller, HttpCode, Param, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { PaginatedModel } from './../../../../common/interfaces/paginated';
import { PredefinedRoles } from './../../../../common/utils/utils';
import { AuthGuard } from './../../../auth/guard/auth.guard';
import { RolesDecorator } from './../../../users/decorators/roles.decorator';
import { RolesGuard } from './../../../users/guards/roles.guard';
import { ContactSearch } from 'kissbot-entities';
import { ContactSearchQueryDto } from './dto/contact-search.dto';
import { ContactSearchService } from './services/contact-search.service';

@Controller('contact-search')
@UseGuards(AuthGuard)
export class ContactSearchController {
    constructor(private readonly contactSearchService: ContactSearchService) {}

    @HttpCode(200)
    @Post('workspaces/:workspaceId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(RolesGuard)
    async getAll(
        @Query(new ValidationPipe()) query: ContactSearchQueryDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<PaginatedModel<ContactSearch>> {
        const { blocked, limit, skip, term } = query;

        const formattedTerm = term
            ? String(term)
                  ?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                  .toLowerCase()
            : undefined;

        return await this.contactSearchService.getAll({
            limit,
            skip,
            workspaceId,
            blocked,
            term: formattedTerm,
        });
    }
}
