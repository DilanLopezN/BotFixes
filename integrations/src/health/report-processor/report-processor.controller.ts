import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
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
    @Query('fileUrl') fileUrl: string,
    @Query('specialityId') specialityId: string,
    @Query('organizationUnitLocationId') organizationUnitLocationId: string,
  ): Promise<ExtractMedicalRequestDataResponse> {
    if (!file && !fileUrl) {
      return { errorMessage: 'Não foi enviado nenhuma imagem com o pedido médico', error: 'ERR_00', procedures: null };
    }

    return this.reportProcessorService.extractMedicalRequestData({
      integrationId,
      file,
      fileUrl,
      specialityId,
      organizationUnitLocationId,
    });
  }
}
