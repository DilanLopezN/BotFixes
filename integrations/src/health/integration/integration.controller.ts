import { Body, Controller, Get, Param, Post, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { IntegrationService } from './integration.service';

@Controller({
  path: 'health/integration',
})
@ApiTags('Integration')
@UseGuards(AuthGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post()
  @ApiResponse({ status: 201, type: CreateIntegrationDto })
  @ApiResponse({ status: 400 })
  async create(@Body(new ValidationPipe()) createIntegrationDto: CreateIntegrationDto) {
    return await this.integrationService.create(createIntegrationDto);
  }

  @Get(':integrationId')
  @ApiResponse({ status: 200, type: CreateIntegrationDto })
  @ApiResponse({ status: 400 })
  async get(@Param('integrationId') integrationId: string) {
    return await this.integrationService.getOne(integrationId);
  }

  @Put(':integrationId')
  @ApiResponse({ status: 200, type: CreateIntegrationDto })
  @ApiResponse({ status: 400 })
  async update(
    @Body(new ValidationPipe()) createIntegrationDto: CreateIntegrationDto,
    @Param('integrationId') integrationId: string,
  ) {
    return await this.integrationService.update(integrationId, createIntegrationDto);
  }
}
