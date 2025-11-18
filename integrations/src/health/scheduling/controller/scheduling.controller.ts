import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SchedulingService } from '../services/scheduling.service';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { SchedulingAuthGuard } from '../../../common/guards/scheduling.guard';
import { ConfirmScheduleDto } from '../dto/confirm-schedule.dto';
import { CancelScheduleDto } from '../dto/cancel-schedule.dto';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { decodeToken } from '../../../common/helpers/decode-token';
import { ListingType, ListSchedules } from '../interfaces/list-schedules.interface';
import { ListSchedulesResumeResponse } from '../interfaces/schedule-resume.interface';
import { SchedulingSettings } from '../interfaces/get-settings.interface';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ListSchedulesDto } from '../dto/list-schedules.dto';
import { SchedulingEventsService } from '../services/scheduling-events.service';
import { ScheduleEventType } from '../interfaces/scheduling-events.interface';
import { EventsService } from 'health/events/events.service';
import { KissbotEventType } from 'kissbot-core';

@Controller({
  path: 'client/:integrationId/scheduling',
})
export class SchedulingController {
  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly schedulingEventsService: SchedulingEventsService,
    private readonly eventsService: EventsService,
  ) {}

  @ApiTags('Scheduling')
  @UseGuards(SchedulingAuthGuard, ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('listSchedules')
  async listSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Headers('Authorization') token: string,
    @Body(new ValidationPipe()) dto: ListSchedulesDto,
  ): Promise<ListSchedulesResumeResponse> {
    const data = decodeToken<ListSchedules>(token, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!data?.patientErpCode || !data?.shortId) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    const listingType = dto.scheduleCode ? ListingType.All : dto.listingType || ListingType.Scheduled;

    const response = await this.schedulingService.listSchedules(integrationId, {
      ...data,
      scheduleCode: dto.scheduleCode,
      listingType,
    });

    try {
      await this.schedulingEventsService.createEvent({
        integrationId,
        shortId: data.shortId,
        type: ScheduleEventType.viewSchedulesList,
        scheduleCode: data.scheduleCode || dto.scheduleCode || null,
      });
    } catch (error) {
      console.error(error);
    }

    return response;
  }

  @ApiTags('Scheduling')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Post('getSettings')
  async getSettings(@Param('integrationId', ObjectIdPipe) integrationId: string): Promise<SchedulingSettings> {
    return await this.schedulingService.getSettings(integrationId);
  }

  @ApiTags('Scheduling')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SchedulingAuthGuard, ThrottlerGuard)
  @Post('confirmSchedule')
  async confirmSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Headers('Authorization') token: string,
    @Body(new ValidationPipe()) dto: ConfirmScheduleDto,
  ): Promise<OkResponse> {
    const data = decodeToken<ListSchedules>(token, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!data?.patientErpCode || !data?.shortId) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    const response = await this.schedulingService.confirmSchedule(integrationId, {
      ...dto,
      patientErpCode: data.patientErpCode,
    });

    try {
      if (!!response?.ok && data?.data?.scheduleId && data?.data?.confirmationType == 'email') {
        await this.eventsService.dispatch(KissbotEventType.SCHEDULING_CONFIRMATION_CONFIRMED, {
          integrationId,
          scheduleId: data.data.scheduleId,
        });
      }
    } catch (error) {
      console.error(error);
    }

    try {
      await this.schedulingEventsService.createEvent({
        integrationId,
        shortId: data.shortId,
        type: ScheduleEventType.confirmSchedule,
        scheduleCode: data.scheduleCode || dto.scheduleCode || null,
      });
    } catch (error) {
      console.error(error);
    }

    return response;
  }

  @ApiTags('Scheduling')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SchedulingAuthGuard, ThrottlerGuard)
  @Post('cancelSchedule')
  async cancelSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Headers('Authorization') token: string,
    @Body(new ValidationPipe()) dto: CancelScheduleDto,
  ): Promise<OkResponse> {
    const data = decodeToken<ListSchedules>(token, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!data?.patientErpCode || !data?.shortId) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    const response = await this.schedulingService.cancelSchedule(integrationId, {
      ...dto,
      patientErpCode: data.patientErpCode,
    });

    try {
      if (!!response?.ok && data?.data?.scheduleId && data?.data?.confirmationType == 'email') {
        await this.eventsService.dispatch(KissbotEventType.SCHEDULING_CONFIRMATION_CANCELED, {
          integrationId,
          scheduleId: data.data.scheduleId,
        });
      }
    } catch (error) {
      console.error(error);
    }

    try {
      await this.schedulingEventsService.createEvent({
        integrationId,
        shortId: data.shortId,
        type: ScheduleEventType.cancelSchedule,
        scheduleCode: data.scheduleCode || dto.scheduleCode || null,
      });
    } catch (error) {
      console.error(error);
    }

    return response;
  }

  @ApiTags('Scheduling')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SchedulingAuthGuard, ThrottlerGuard)
  @Post('viewSchedulingResume')
  async viewSchedulingResume(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Headers('Authorization') token: string,
  ): Promise<OkResponse> {
    const data = decodeToken<ListSchedules>(token, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!data?.patientErpCode || !data?.shortId) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

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

    return { ok: true };
  }
}
