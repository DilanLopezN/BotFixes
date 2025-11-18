import { BadRequestException, Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SchedulingService } from '../services/scheduling.service';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { StringPipe } from '../../../common/pipes/string.pipe';
import { decodeToken } from '../../../common/helpers/decode-token';
import { SchedulingAuthGuard } from '../../../common/guards/scheduling.guard';
import { ScheduleEventType } from '../interfaces/scheduling-events.interface';
import { SchedulingEventsService } from '../services/scheduling-events.service';
import { DownloadTokenData } from '../interfaces/download-token.interface';

@Controller({
  path: 'client/:integrationId/download',
})
export class SchedulingDownloadController {
  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly schedulingEventsService: SchedulingEventsService,
  ) {}

  @UseGuards(SchedulingAuthGuard)
  @Get()
  async downloadGuidance(
    @Res() res: Response,
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query('token', StringPipe) token: string,
  ): Promise<void> {
    const data = decodeToken<DownloadTokenData>(token, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!data?.integrationId || !data?.patientErpCode) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    const buffer = await this.schedulingService.downloadGuidance(integrationId, data);

    try {
      await this.schedulingEventsService.createEvent({
        integrationId,
        shortId: data.shortId,
        type: ScheduleEventType.guidanceView,
        scheduleCode: data.scheduleCode || undefined,
      });
    } catch (error) {
      console.error(error);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', 'attachment; filename=Preparos.pdf');
    res.end(buffer);
  }
}
