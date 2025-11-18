import { Body, Controller, Param, Post, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ObjectIdPipe } from '../../common/pipes/objectId.pipe';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateFlowDto } from './dto/create-flow.dto';
import { FlowService } from './service/flow.service';
import * as moment from 'moment';
import { Flow } from './schema/flow.schema';
import { castObjectId } from '../../common/helpers/cast-objectid';
import { IApiFlow } from './interfaces/flow.interface';

type ApiFlowEntities = Pick<
  IApiFlow,
  | 'appointmentTypeId'
  | 'doctorId'
  | 'insuranceId'
  | 'insurancePlanId'
  | 'insuranceSubPlanId'
  | 'organizationUnitId'
  | 'planCategoryId'
  | 'procedureId'
  | 'specialityId'
  | 'occupationAreaId'
  | 'organizationUnitLocationId'
  | 'typeOfServiceId'
  | 'reasonId'
> &
  any;

@Controller('integration/:integrationId/health/flow')
@ApiTags('Flow')
@UseGuards(AuthGuard)
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  private mapEntitiesToObjectId(flow: CreateFlowDto): ApiFlowEntities {
    return {
      appointmentTypeId: flow?.appointmentTypeId?.map((key) => castObjectId(key)),
      doctorId: flow?.doctorId?.map((key) => castObjectId(key)),
      insuranceId: flow?.insuranceId?.map((key) => castObjectId(key)),
      insurancePlanId: flow?.insurancePlanId?.map((key) => castObjectId(key)),
      insuranceSubPlanId: flow?.insuranceSubPlanId?.map((key) => castObjectId(key)),
      organizationUnitId: flow?.organizationUnitId?.map((key) => castObjectId(key)),
      planCategoryId: flow?.planCategoryId?.map((key) => castObjectId(key)),
      procedureId: flow?.procedureId?.map((key) => castObjectId(key)),
      specialityId: flow?.specialityId?.map((key) => castObjectId(key)),
      occupationAreaId: flow?.occupationAreaId?.map((key) => castObjectId(key)),
      organizationUnitLocationId: flow?.organizationUnitLocationId?.map((key) => castObjectId(key)),
      typeOfServiceId: flow?.typeOfServiceId?.map((key) => castObjectId(key)),
      reasonId: flow?.reasonId?.map((key) => castObjectId(key)),
    };
  }

  @Post('sync')
  @ApiResponse({ status: 400 })
  async syncFlows(@Param('integrationId', ObjectIdPipe) integrationId: string) {
    return await this.flowService.sync(castObjectId(integrationId));
  }

  @Post('sync-draft')
  @ApiResponse({ status: 400 })
  async syncDraftFlows(
    @Body(new ValidationPipe()) dto: CreateFlowDto[],
    @Param('integrationId', ObjectIdPipe) integrationId: string,
  ) {
    return await this.flowService.syncDraft(
      castObjectId(integrationId),
      dto.map((dto) => ({
        ...dto,
        ...this.mapEntitiesToObjectId(dto),
      })),
    );
  }

  @Post()
  async createFlow(
    @Body(new ValidationPipe()) dto: CreateFlowDto,
    @Param('integrationId', ObjectIdPipe) integrationId: string,
  ): Promise<Flow> {
    return await this.flowService.create({
      ...dto,
      deletedAt: undefined,
      integrationId,
      ...this.mapEntitiesToObjectId(dto),
      createdAt: moment().valueOf(),
    });
  }

  @Put(':flowId')
  async updateFlow(
    @Body() dto: CreateFlowDto,
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Param('flowId', ObjectIdPipe) flowId: string,
  ) {
    return await this.flowService.update(flowId, {
      ...dto,
      deletedAt: undefined,
      integrationId,
      ...this.mapEntitiesToObjectId(dto),
      updatedAt: moment().valueOf(),
    });
  }
}
