import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CancelReasonService } from '../services/cancel-reason/cancel-reason.service';
import {
  CreateCancelReasonDto,
  UpdateCancelReasonDto,
  ListWorkspaceDto,
  GetCancelReasonDto,
} from '../dto/cancel-reason.dto';
import { CancelReason } from '../models/cancel-reason.entity';
import {
  FindCancelReasonByIdListParams,
} from '../interfaces/list-schedule-cancel-reason.interface';

@ApiTags('CancelReason')
@Controller('cancel-reason')
export class CancelReasonController {
  constructor(private cancelReasonService: CancelReasonService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new cancel reason' })
  @ApiBody({ type: CreateCancelReasonDto })
  @ApiResponse({
    status: 201,
    description: 'Cancel reason created successfully',
    type: CancelReason,
  })
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: CreateCancelReasonDto,
  ): Promise<CancelReason> {
    return await this.cancelReasonService.createCancelReason(
      body.workspaceId,
      body,
    );
  }

  @Post('update')
  @ApiOperation({ summary: 'Update a cancel reason' })
  @ApiBody({ type: UpdateCancelReasonDto })
  @ApiResponse({
    status: 200,
    description: 'Cancel reason updated successfully',
    type: Object,
  })
  async update(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: UpdateCancelReasonDto,
  ): Promise<{ ok: boolean }> {
    return await this.cancelReasonService.updateCancelReason(
      body.workspaceId,
      body.id,
      body,
    );
  }

  @Post('list')
  @ApiOperation({ summary: 'List cancel reasons by workspace ID' })
  @ApiBody({ type: ListWorkspaceDto })
  @ApiResponse({
    status: 200,
    description: 'List of cancel reasons',
    type: [CancelReason],
  })
  async listByWorkspaceId(
    @Body() body: ListWorkspaceDto,
  ): Promise<CancelReason[]> {
    return await this.cancelReasonService.listByWorkspaceId(body.workspaceId);
  }

  //Por enquanto comentado pois não sabemos onde está sendo usado
  // @Post('find')
  // @ApiOperation({ summary: 'Find cancel reasons by workspace Id and other filters' })
  // @ApiBody({
  //   description: 'Get cancel reasons parameters',
  //   type: DefaultRequest<ListScheduleCancelReasonParams>,
  // })
  // @ApiResponse({ status: 200, description: 'Found cancel reasons' })
  // async getCancelReasons(
  //   @Body() body: DefaultRequest<ListScheduleCancelReasonParams>,
  // ): Promise<DefaultResponse<CancelReason[]>> {
  //   return await this.cancelReasonService.getCancelReasons(body?.data?.workspaceId, body);
  // }

  @Post('findCancelReasonByWorkspaceIdAndIds')
  @ApiOperation({
    summary: 'Find cancel reasons by workspace Id and reason id list',
  })
  @ApiBody({
    description: 'Get cancel reasons parameters',
    type: FindCancelReasonByIdListParams,
  })
  @ApiResponse({ status: 200, description: 'Found cancel reasons' })
  async findCancelReasonByWorkspaceIdAndIds(
    @Body() body: FindCancelReasonByIdListParams,
  ): Promise<CancelReason[]> {
    return await this.cancelReasonService.findCancelReasonByWorkspaceIdAndIds(
      body?.workspaceId,
      body.ids,
    );
  }

  @Post('get')
  @ApiOperation({ summary: 'Get a cancel reason by ID' })
  @ApiBody({ type: GetCancelReasonDto })
  @ApiResponse({
    status: 200,
    description: 'Cancel reason found',
    type: CancelReason,
  })
  async findOne(@Body() body: GetCancelReasonDto): Promise<CancelReason> {
    return await this.cancelReasonService.findOne(body.reasonId);
  }
}
