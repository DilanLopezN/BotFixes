import { Body, Controller, Post } from '@nestjs/common';
import { TeamService } from '../services/team.service';

// Começa com internal pra seguir o mesmo padrão do engine.
// Esse controller vai servir para projetos internos e não vai ser exposto para o mundo
@Controller('internal/team')
export class InternalTeamController {
    constructor(private readonly teamService: TeamService) {}

    @Post('getTeamByIds')
    async getConversationIdByScheduleMessageUuidList(
        @Body() body: { workspaceId: string; teamIds: string[] },
    ): Promise<any> {
        return await this.teamService.getTeamsByIds(body.workspaceId, body.teamIds);
    }
}
