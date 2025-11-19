import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { ReportProcessorService } from './services/report-processor.service';
import { ObjectIdPipe } from '../../common/pipes/objectId.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { File } from '../../common/interfaces/uploaded-file';
import { ExtractMedicalRequestDataResponse } from './interfaces/extract-medical-request-data.inteface';
import { OkResponse } from 'common/interfaces/ok-response.interface';
import { ExtractMedicalRequestQueryDto } from './dto/extract-medical-request.dto';

@UseGuards(AuthGuard)
@UseInterceptors(AuditInterceptor)
@Controller({
  path: 'integration/:integrationId/health/report-processor',
})
export class ReportProcessorController {
  constructor(private readonly reportProcessorService: ReportProcessorService) {}

  @ApiTags('Schedule')
  @HttpCode(HttpStatus.OK)
  @Post('extractMedicalRequestData')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10_000_000 } }))
  async extractMedicalRequestData(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @UploadedFile() file: File,
    @Body() body: ExtractMedicalRequestQueryDto,
  ): Promise<ExtractMedicalRequestDataResponse> {
    if (!file && !body.fileUrl) {
      return { errorMessage: 'Não foi enviado nenhuma imagem com o pedido médico', error: 'ERR_00', procedures: null };
    }

    return this.reportProcessorService.extractMedicalRequestData({
      integrationId,
      file,
      fileUrl: body.fileUrl,
      filter: body.filter,
    });
  }

  @ApiTags('Schedule')
  @HttpCode(HttpStatus.OK)
  @Post('importRagEntities')
  async importRagEntities(@Param('integrationId', ObjectIdPipe) integrationId: string): Promise<OkResponse> {
    return this.reportProcessorService.importRagProceduresUsingIntegrationId(integrationId);
  }
}
