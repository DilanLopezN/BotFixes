import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Documents } from './entities/documents.entity';
import { UploadDocument, UploadDocumentResponse } from './interfaces/upload-document.interface';
import { S3Service } from '../../common/s3-module/s3.service';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { DeleteDocument } from './interfaces/delete-document.interface';
import { OkResponse } from '../../common/interfaces/ok-response.interface';
import { ListDocuments, SimplifiedDocument } from './interfaces/list-documents.interface';
import { IntegratorService } from '../integrator/service/integrator.service';
import * as crypto from 'crypto';
import { fromBuffer } from 'file-type';
import { DocumentFileType } from './interfaces/list-document-types.interface';
import { S3_BUCKET_NAME } from './default';
import { IntegrationService } from '../integration/integration.service';
import { stripMetadata } from '../../common/helpers/strip-metadata-image';

@Injectable()
export class DocumentsService {
  private readonly bucketName = S3_BUCKET_NAME;
  private logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Documents, INTEGRATIONS_CONNECTION_NAME)
    private readonly documentsRepository: Repository<Documents>,
    private readonly s3Service: S3Service,
    private readonly integratorService: IntegratorService,
    private readonly integrationService: IntegrationService,
  ) {}

  async getSignedUrl(key: string, expiresIn = 600): Promise<string> {
    return this.s3Service.getSignedUrl({
      key,
      bucketName: this.bucketName,
      expiresIn,
    });
  }

  private generateHash12() {
    return crypto.randomBytes(9).toString('base64url');
  }

  private generateHash15() {
    return crypto.randomBytes(11).toString('base64url').substring(0, 15);
  }

  public async uploadDocument({
    integrationId,
    file,
    scheduleCode,
    description,
    appointmentTypeCode,
    fileTypeCode,
    patientCode,
  }: UploadDocument): Promise<UploadDocumentResponse> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration) {
      throw new BadRequestException({ ok: false, message: 'Integration not found' });
    }

    if (!integration?.documents?.enableDocumentsUpload) {
      throw new BadRequestException({ ok: false, message: 'Integration document upload disabled' });
    }

    // Verifica se o paciente já possui limite de 15 documentos para o agendamento
    const existingDocuments = await this.documentsRepository.count({
      where: { integrationId, scheduleCode, patientCode, deletedAt: null },
    });

    if (existingDocuments >= 15) {
      throw new BadRequestException({
        ok: false,
        message: 'You have reached the limit of 15 documents for this schedule',
      });
    }

    const sanitizedFile = file;
    const fileTypeResult = await fromBuffer(sanitizedFile.buffer);

    // Verifica se é uma imagem para aplicar sanitização
    if (fileTypeResult?.mime?.startsWith('image/')) {
      try {
        const result = await stripMetadata(file);
        sanitizedFile.buffer = result.buffer;
        sanitizedFile.mimetype = result.mimetype;
      } catch (error) {
        this.logger.error(`DocumentsService.uploadDocument, error sanitizing image: ${error.message}`, error.stack);
        throw new BadRequestException({ ok: false, message: 'Invalid or corrupt image file provided' });
      }
    }

    const { mimetype: mimeType, originalname, buffer } = sanitizedFile;
    const hash = this.generateHash12();
    const hashFileName = this.generateHash15();

    // como o buffer foi sanitizado, é necessário pegar o novo tipo de arquivo
    const newFileTypeResult = await fromBuffer(sanitizedFile.buffer);
    // pega a extensão do arquivo
    const extension = newFileTypeResult.ext;
    const fileName = `${hash}-${hashFileName}.${extension}`;
    const s3Key = `${integrationId}/${patientCode}/${scheduleCode}/${fileName}`;

    // salva para usar no update do erp
    let createdDocumentId: string = undefined;

    try {
      await this.s3Service.uploadFile({
        bucketName: this.bucketName,
        key: s3Key,
        body: buffer,
        contentType: mimeType,
        metadata: {
          hash,
        },
      });

      const result = await this.documentsRepository.save({
        integrationId: integrationId,
        scheduleCode: scheduleCode,
        originalName: originalname,
        name: fileName,
        description: description,
        hash,
        s3Key: s3Key,
        mimeType: mimeType,
        extension,
        fileTypeCode: fileTypeCode,
        patientCode,
        appointmentTypeCode,
      });

      createdDocumentId = result.id;
    } catch (error) {
      this.logger.error(`DocumentsService.uploadDocument, error uploading s3: ${error.message}`, error.stack);
      throw new BadRequestException({ ok: false, message: 'Failed to upload document' });
    }

    try {
      const signedUrl = await this.getSignedUrl(s3Key);
      const response = await this.integratorService.patientUploadScheduleFile(integrationId, {
        fileName: originalname,
        scheduleCode: scheduleCode,
        fileUrl: signedUrl,
        description: description,
        mimeType,
        hash,
        extension,
        appointmentTypeCode,
        fileTypeCode,
        patientCode,
      });

      if (!response?.ok) {
        this.logger.error('DocumentsService.uploadDocument, error updating document with erpCreatedAt');
        return { ok: true, message: 'Failed to upload document. Trying later' };
      }

      await this.documentsRepository.update({ id: createdDocumentId }, { erpCreatedAt: new Date() });
      return { ok: response?.ok ?? false };
    } catch (error) {
      this.logger.error(
        `DocumentsService.uploadDocument, error uploading document to ERP: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({ ok: false, message: 'Failed to upload document to ERP' });
    }
  }

  async deleteDocument({ documentId, integrationId, scheduleCode, patientCode }: DeleteDocument): Promise<OkResponse> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration) {
      throw new BadRequestException({ ok: false, message: 'Integration not found' });
    }

    if (!integration?.documents?.enableDocumentsUpload) {
      throw new BadRequestException({ ok: false, message: 'Integration document upload disabled' });
    }

    try {
      const document = await this.documentsRepository.findOne({
        where: { scheduleCode, integrationId, id: documentId, patientCode },
      });

      if (!document) {
        throw new BadRequestException({ ok: false, message: 'Document not found' });
      }

      await this.s3Service.deleteFile({
        bucketName: this.bucketName,
        key: document.s3Key,
      });

      const response = await this.integratorService.patientDeleteScheduleFile(integrationId, {
        fileName: document.originalName,
        scheduleCode: scheduleCode,
        hash: document.hash,
        patientCode,
        appointmentTypeCode: document.appointmentTypeCode,
        fileTypeCode: document.fileTypeCode,
      });

      if (!response?.ok) {
        throw new BadRequestException({ ok: false, message: 'Failed to delete document from ERP' });
      }

      await this.documentsRepository.remove(document);
      return { ok: response?.ok || false };
    } catch (error) {
      this.logger.error(`DocumentsService.deleteDocument, error uploading document: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({ ok: false, message: 'Failed to delete document' });
    }
  }

  async listDocumentsForSchedule({
    integrationId,
    scheduleCode,
    patientCode,
  }: ListDocuments): Promise<SimplifiedDocument[]> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration?.documents?.enableDocumentsUpload) {
      return [];
    }

    const result = await this.documentsRepository.find({
      where: {
        integrationId,
        patientCode,
        scheduleCode,
        deletedAt: null,
      },
    });

    if (!result?.length) {
      return [];
    }

    return await Promise.all(
      result.map(async (document) => {
        const signedUrl = await this.getSignedUrl(document.s3Key, 7_200);

        return {
          id: document.id,
          originalName: document.originalName,
          fileTypeCode: document.fileTypeCode,
          createdAt: document.createdAt,
          extension: document.extension,
          url: signedUrl,
        };
      }),
    );
  }

  async listDocumentTypes(integrationId: string): Promise<DocumentFileType[]> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration?.documents?.enableDocumentsUpload) {
      return [];
    }

    return await this.integratorService.listFileTypesToUpload(integrationId);
  }

  async listDocumentsWithoutErpCreatedAt(integrationIds: string[]): Promise<Documents[]> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    return this.documentsRepository.find({
      where: {
        erpCreatedAt: null,
        createdAt: LessThan(tenMinutesAgo),
        deletedAt: null,
        integrationId: In(integrationIds),
      },
      take: 50,
    });
  }
}
