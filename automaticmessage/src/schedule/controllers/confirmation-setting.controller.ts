import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  CreateConfirmationSettingDto,
  UpdateConfirmationSettingDto,
  ListConfirmationSettingDto,
} from '../dto/confirmation-setting.dto';
import { ConfirmationSettingService } from '../services/confirmation/confirmation-setting.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('ConfirmationSetting')
@Controller('confirmation-setting')
export class ConfirmationSettingController {
  constructor(
    private readonly confirmationSettingService: ConfirmationSettingService,
  ) {}
  
  @Post('create')
  @ApiOperation({ summary: 'Create a new confirmation setting' })
  @ApiBody({ type: CreateConfirmationSettingDto })
  @ApiResponse({ status: 201, description: 'Confirmation setting created successfully', type: Object })
  async createConfirmationSetting(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: CreateConfirmationSettingDto,
  ) {
    return await this.confirmationSettingService.createConfirmationSetting(body);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update an existing confirmation setting' })
  @ApiBody({ type: UpdateConfirmationSettingDto })
  @ApiResponse({ status: 200, description: 'Confirmation setting updated successfully', type: Object })
  async updateConfirmationSetting(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: UpdateConfirmationSettingDto,
  ) {
    return await this.confirmationSettingService.updateConfirmationSetting(body);
  }

  @Post('listConfirmationSettingByWorkspaceId')
  @ApiOperation({ summary: 'List all confirmation settings for a workspace' })
  @ApiBody({ type: ListConfirmationSettingDto })
  @ApiResponse({ status: 200, description: 'List of confirmation settings', type: Array })
  async listConfirmationSetting(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ListConfirmationSettingDto,
  ) {
    return await this.confirmationSettingService.listConfirmationSettingByWorkspaceId(
      body.workspaceId,
    );
  }
}
