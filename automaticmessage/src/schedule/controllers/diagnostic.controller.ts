import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiagnosticService } from '../services/diagnostic/diagnostic.service';
import { ListDiagnosticExtractionsDto } from '../dto/list-diagnostics-extraction.dto';
import { RunManualExtractionDto } from '../dto/run-manual-extraction.dto';
import { ListExtractDataDto } from '../dto/list-extract-data.dto';

@ApiTags('Diagnostics')
@Controller('diagnostics')
export class DiagnosticController {
  constructor(private readonly diagnosticService: DiagnosticService) {}

  @Post('listDiagnosticExtractions')
  @ApiOperation({ summary: 'List diagnostic extractions for a schedule setting' })
  @ApiResponse({ status: 200, description: 'Diagnostic extractions listed successfully', type: Array })
  async listDiagnosticExtractions(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ListDiagnosticExtractionsDto,
  ): Promise<Array<any>> {
    return await this.diagnosticService.listDiagnosticExtractions(
      body.scheduleSettingId,
      body.workspaceId,
    );
  }

  @Post('runManualExtraction')
  @ApiOperation({ summary: 'Run a manual extraction process' })
  @ApiResponse({ status: 200, description: 'Manual extraction executed successfully', type: Object })
  async runManualExtraction(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: RunManualExtractionDto,
  ): Promise<any> {
    return await this.diagnosticService.runManualExtraction(body, body.workspaceId);
  }

  @Post('listExtractData')
  @ApiOperation({ summary: 'List extraction data based on filters' })
  @ApiResponse({ status: 200, description: 'Extract data listed successfully', type: Object })
  async listExtractData(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ListExtractDataDto,
  ): Promise<any> {
    return await this.diagnosticService.listExtractData(body, body.workspaceId);
  }
}
