import { Body, Controller, Get, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ReportsValidatorGuard } from '../guards/reports-validator.guard';
import { ReportsWorkspaceIdDecorator } from '../decorators/reports-workspaceId.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FilterCampaignInfoDto } from '../dto/filter_get_campaign_info.dto';
import { ReportsService } from '../services/reports.service';
import { Result_getUserList } from '../interfaces/result_get_user_list.interface';
import { Result_getCampaignReports } from '../interfaces/result_get_campaign_reports.interface';

@Controller('relatorios')
export class ReportsControler {
    constructor(private readonly reportsService: ReportsService) {}
    @UseGuards(ThrottlerGuard)
    @Throttle(30, 60)
    @Post('lista_transmissao_info')
    @UseGuards(ReportsValidatorGuard)
    async getCapaignInfo(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) filter: FilterCampaignInfoDto,
        @ReportsWorkspaceIdDecorator() workspaceId: string,
    ): Promise<Result_getCampaignReports[]> {
        return await this.reportsService.getCampaignReports(workspaceId, filter);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(30, 60)
    @Get('lista_usuarios')
    @UseGuards(ReportsValidatorGuard)
    async getUserList(@ReportsWorkspaceIdDecorator() workspaceId: string): Promise<Result_getUserList[]> {
        return await this.reportsService.getUserList(workspaceId);
    }
}
