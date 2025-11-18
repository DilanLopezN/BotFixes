import { Controller, Get, HttpCode, HttpStatus, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { SchedulingService } from '../services/scheduling.service';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { decodeToken } from '../../../common/helpers/decode-token';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EventsService } from 'health/events/events.service';
import { KissbotEventType } from 'kissbot-core';
import { ConfirmationScheduleDataEmail } from '../interfaces/confirmation-schedule-data-email.interface';
import { SchedulingEmailService } from '../services/scheduling-email.service';
import { SchedulingEmailAuthGuard } from '../../../common/guards/scheduling-email.guard';
import { confirmationEmailCancelCounter, confirmationEmailConfirmCounter } from '../../../common/prom-metrics';
import { IntegrationService } from '../../integration/integration.service';
import { castObjectIdToString } from '../../../common/helpers/cast-objectid';
import { SchedulingGuidanceFormat } from 'health/integration/interfaces/integration.interface';

@Controller({
  path: 'client/:integrationId/scheduling-email',
})
export class SchedulingEmailController {
  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly eventsService: EventsService,
    private readonly schedulingEmailService: SchedulingEmailService,
    private readonly integrationService: IntegrationService,
  ) {}

  @ApiTags('Scheduling')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SchedulingEmailAuthGuard, ThrottlerGuard)
  @Get('confirmSchedule')
  async confirmSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query('cfToken') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const data = decodeToken<ConfirmationScheduleDataEmail>(token, process.env.CF_TOKEN_KEY);
    const integration = await this.integrationService.getOne(integrationId);

    const responsePromises = await Promise.all(
      data.scheduleIds?.map(async (scheduleId) => {
        const response = await this.schedulingService.confirmSchedule(integrationId, {
          scheduleId: Number(scheduleId),
          patientErpCode: data.patientErpCode,
          data: data.data,
        });

        try {
          if (!!response?.ok && data?.scheduleId) {
            await this.eventsService.dispatch(KissbotEventType.SCHEDULING_CONFIRMATION_CONFIRMED, {
              integrationId,
              scheduleId: data.scheduleId,
            });
          }
        } catch (error) {
          console.error(error);
        }
        return response;
      }),
    );

    const response: any = responsePromises?.[0];

    if (response?.status === HttpStatus.CONFLICT) {
      const linkRedirectError = await this.schedulingEmailService.getAccessLinkScheduleResumeAndRedirect(
        integration,
        data,
        `confirmation/resume/${data.scheduleCode}/error?confirmError=true`,
      );
      res.redirect(linkRedirectError);
      return;
    }

    try {
      confirmationEmailConfirmCounter
        .labels(castObjectIdToString(integration._id), integration.name, integration.type)
        .inc();
    } catch (error) {}

    const link = await this.schedulingEmailService.getAccessLinkScheduleResumeAndRedirect(
      integration,
      data,
      `confirmation/resume/${data.scheduleCode}/success?confirmAppointment=true`,
    );
    res.redirect(link);
  }

  @ApiTags('Scheduling')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SchedulingEmailAuthGuard, ThrottlerGuard)
  @Get('cancelSchedule')
  async cancelSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query('cfToken') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const data = decodeToken<ConfirmationScheduleDataEmail>(token, process.env.CF_TOKEN_KEY);
    const integration = await this.integrationService.getOne(integrationId);

    const responsePromises = await Promise.all(
      data.scheduleIds?.map(async (scheduleId) => {
        const response = await this.schedulingService.cancelSchedule(integrationId, {
          scheduleId: Number(scheduleId),
          patientErpCode: data.patientErpCode,
          data: data.data,
        });

        try {
          if (!!response?.ok && data?.scheduleId) {
            await this.eventsService.dispatch(KissbotEventType.SCHEDULING_CONFIRMATION_CANCELED, {
              integrationId,
              scheduleId: data.scheduleId,
            });
          }
        } catch (error) {
          console.error(error);
        }

        return response;
      }),
    );

    const response: any = responsePromises?.[0];

    if (response?.status === HttpStatus.CONFLICT) {
      // Se já foi cancelado redireciona para tela de sucesso sem tentar cancelar novamente na integração.
      const linkRedirectError = await this.schedulingEmailService.getAccessLinkScheduleResumeAndRedirect(
        integration,
        data,
        `confirmation/resume/${data.scheduleCode}/success?cancelAppointment=true`,
      );
      res.redirect(linkRedirectError);
      return;
    }

    try {
      confirmationEmailCancelCounter
        .labels(castObjectIdToString(integration._id), integration.name, integration.type)
        .inc();
    } catch (error) {}

    const link = await this.schedulingEmailService.getAccessLinkScheduleResumeAndRedirect(
      integration,
      data,
      `confirmation/resume/${data.scheduleCode}/success?cancelAppointment=true`,
    );
    res.redirect(link);
  }

  @ApiTags('Scheduling')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SchedulingEmailAuthGuard, ThrottlerGuard)
  @Get('redirect-resume')
  async redirect(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query('cfToken') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const data = decodeToken<ConfirmationScheduleDataEmail>(token, process.env.CF_TOKEN_KEY);
    const integration = await this.integrationService.getOne(integrationId);

    const link = await this.schedulingEmailService.getAccessLinkResumeAndRedirect(integration, data);
    res.redirect(link);
  }
}
