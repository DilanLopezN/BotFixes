import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ScheduleNotificationService } from './services/schedule-notification.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ListScheduleNotificationsDto } from './dto/list-schedule-notifications.dto';
import { ObjectIdPipe } from '../../common/pipes/objectId.pipe';
import { NotificationScheduleResponse } from './interfaces/list-schedule-notifications.interface';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';

@UseInterceptors(AuditInterceptor)
@UseGuards(AuthGuard)
@Controller({
  path: 'integration/:integrationId/health/schedule-notification',
})
export class ScheduleNotificationController {
  constructor(private readonly scheduleNotificationService: ScheduleNotificationService) {}

  @ApiTags('Schedule Notification')
  @HttpCode(HttpStatus.OK)
  @Post('listScheduleNotifications')
  async listScheduleNotifications(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ListScheduleNotificationsDto,
  ): Promise<NotificationScheduleResponse> {
    return await this.scheduleNotificationService.listScheduleNotifications(integrationId, dto);
  }
}
