import { Controller, Post, HttpCode, HttpStatus, Param, Body, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ObjectIdPipe } from 'common/pipes/objectId.pipe';
import { ListAvailableSchedulesOutputDto, ListAvailableSchedulesInputDto } from '../dto/available-schedules.dto';
import { ListAvailableSchedulesOutput } from '../interfaces/available-schedules.interface';
import { SchedulingAppointmentsService } from '../services/scheduling-appointments.service';
import { CreateScheduleOutputDto, CreateScheduleInputDto } from '../dto/create-schedules.dto';
import { CreateScheduleOutput } from '../interfaces/create-schedule.interface';
import { GetScheduleValueInputDto, GetScheduleValueOutputDto } from '../dto/get-schedule-value.dto';
import { GetScheduleValueOutput } from '../interfaces/get-schedule-value.interface';

// @Injectable()
// // class CorsInterceptor implements NestInterceptor {
// //   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
// //     const response = context.switchToHttp().getResponse();

// //     const origin =
// //       process.env.NODE_ENV === 'production' ? 'https://agendamento.botdesigner.io/' : 'http://localhost:8100/';

// //     response.setHeader('Access-Control-Allow-Origin', origin);
// //     response.setHeader('Access-Control-Allow-Methods', 'POST');
// //     response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

// //     return next.handle();
// //   }
// // }

// @UseInterceptors(CorsInterceptor)
@Controller({
  path: 'client/:integrationId/scheduling/appointments',
})
export class SchedulingAppointmentsController {
  constructor(private readonly schedulingAppointmentsService: SchedulingAppointmentsService) {}

  @Post('availableSchedules')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: false, status: 200, type: ListAvailableSchedulesOutputDto })
  async listAvailableSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listAvailableSchedulesInput: ListAvailableSchedulesInputDto,
  ): Promise<ListAvailableSchedulesOutput> {
    return this.schedulingAppointmentsService.listAvailableSchedules(integrationId, false, listAvailableSchedulesInput);
  }

  @Post('getScheduleValue')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: false, status: 200, type: GetScheduleValueOutputDto })
  async getScheduleValue(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) getScheduleValueInput: GetScheduleValueInputDto,
  ): Promise<GetScheduleValueOutput> {
    return this.schedulingAppointmentsService.getScheduleValue(integrationId, getScheduleValueInput);
  }

  @Post('createSchedule')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: false, status: 200, type: CreateScheduleOutputDto })
  async createSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) createScheduleInput: CreateScheduleInputDto,
  ): Promise<CreateScheduleOutput> {
    return this.schedulingAppointmentsService.createSchedule(integrationId, createScheduleInput);
  }
}
