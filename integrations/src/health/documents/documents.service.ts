import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository, IsNull, Not, In } from 'typeorm';
import { Documents } from './entities/documents.entity';
import { UploadDocument, UploadDocumentResponse } from './interfaces/upload-document.interface';
import { S3Service } from '../../common/s3-module/s3.service';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { DeleteDocument } from './interfaces/delete-document.interface';
import { OkResponse } from '../../common/interfaces/ok-response.interface';
import { ListDocuments, SignedSimplifiedDocument, SimplifiedDocument } from './interfaces/list-documents.interface';
import { IntegratorService } from '../integrator/service/integrator.service';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { fromBuffer } from 'file-type';
import { DocumentFileType } from './interfaces/list-document-types.interface';
import { IntegrationService } from '../integration/integration.service';
import { stripMetadata } from '../../common/helpers/strip-metadata-image';
import { ListPatientSchedules } from './interfaces/list-patient-schedules.interface';
import { Appointment } from '../interfaces/appointment.interface';
import { Cron, CronExpression } from '@nestjs/schedule';
import { shouldRunCron } from '../../common/bootstrap-options';
import { castObjectIdToString } from '../../common/helpers/cast-objectid';
import { IntegrationCacheUtilsService } from '../integration-cache-utils/integration-cache-utils.service';
import { AuditDataType, AuditIdentifier } from '../audit/audit.interface';
import { AuditService } from '../audit/services/audit.service';
import { AuthenticatePatient } from './interfaces/authenticate-patient.interface';
import { PatientTokenData } from './interfaces/patient-token-data.interface';
import { DocumentSourceType } from './interfaces/documents.interface';
import { AgentUploadFile, PatientUploadFile } from '../integrator/interfaces';

@Injectable()
export class DocumentsService {
  private readonly bucketName = process.env.S3_BUCKET_BOTDESIGNER_ERP_DOCUMENTS;
  private logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Documents, INTEGRATIONS_CONNECTION_NAME)
    private readonly documentsRepository: Repository<Documents>,
    private readonly s3Service: S3Service,
    private readonly integratorService: IntegratorService,
    private readonly integrationService: IntegrationService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly auditService: AuditService,
  ) {}

  async getSignedUrl(key: string, expiresIn = 900): Promise<string> {
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
    externalId,
    source,
    erpUsername,
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
        integrationId,
        scheduleCode,
        originalName: originalname,
        name: fileName,
        description,
        hash,
        s3Key,
        mimeType,
        extension,
        fileTypeCode,
        patientCode,
        appointmentTypeCode,
        externalId,
        source,
        erpUsername,
      });

      createdDocumentId = result.id;
    } catch (error) {
      this.logger.error(`DocumentsService.uploadDocument, error uploading s3: ${error.message}`, error.stack);
      throw new BadRequestException({ ok: false, message: 'Failed to upload document' });
    }

    try {
      const signedUrl = await this.getSignedUrl(s3Key);
      const request = erpUsername
        ? this.integratorService.agentUploadScheduleFile(integrationId, {
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
            erpUsername,
          })
        : this.integratorService.patientUploadScheduleFile(integrationId, {
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

      const response = await request;

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

  async listAllDocumentsForSchedule({
    integrationId,
    scheduleCode,
    patientCode,
  }: ListDocuments): Promise<SignedSimplifiedDocument[]> {
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
      select: ['id', 'originalName', 'fileTypeCode', 'createdAt', 'extension', 'externalId', 's3Key'],
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
          externalId: document.externalId,
          url: signedUrl,
        };
      }),
    );
  }

  async listPatientPortalDocumentsForSchedule({
    integrationId,
    scheduleCode,
    patientCode,
  }: ListDocuments): Promise<SignedSimplifiedDocument[]> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration?.documents?.enableDocumentsUpload) {
      return [];
    }

    const result = await this.documentsRepository.find({
      where: {
        integrationId,
        patientCode,
        scheduleCode,
        source: In([DocumentSourceType.patient_portal]),
        deletedAt: null,
      },
      select: ['id', 'originalName', 'fileTypeCode', 'createdAt', 'extension', 's3Key'],
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

  async listDocumentsWithoutErpCreatedAt(limit = 50): Promise<Documents[]> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    return this.documentsRepository.find({
      where: {
        erpCreatedAt: IsNull(),
        createdAt: LessThan(tenMinutesAgo),
        deletedAt: IsNull(),
        retryCount: LessThan(10),
      },
      take: limit,
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async retryFailedDocuments(): Promise<void> {
    const lockKey = 'failed-docs:lock';
    const lockTtl = 25 * 60;

    const lockAcquired = await this.integrationCacheUtilsService.acquireLock(lockKey, lockTtl);
    if (!lockAcquired) return;

    const MAX_DOCUMENTS_PER_RUN = 20;
    const BATCH_SIZE = 5;

    try {
      const failedDocuments = await this.listDocumentsWithoutErpCreatedAt(MAX_DOCUMENTS_PER_RUN);
      if (!failedDocuments.length) return;

      for (let i = 0; i < failedDocuments.length; i += BATCH_SIZE) {
        const batch = failedDocuments.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(batch.map((doc) => this.retryDocumentUpload(doc)));

        results.forEach((result, idx) => {
          if (result.status === 'rejected') {
            const document = batch[idx];

            const defaultAuditData = {
              dataType: AuditDataType.code,
              integrationId: castObjectIdToString(document.integrationId),
              identifier: AuditIdentifier.uploadDocumentFailed,
            };

            this.auditService.sendAuditEvent({
              ...defaultAuditData,

              data: {
                msg: { documentId: document.id },
                data: result?.reason?.stack || result?.reason,
              },
            });

            this.logger.error(
              `Error processing document ${document.id}: ${result.reason?.message}`,
              result.reason?.stack,
            );
          }
        });
      }
    } catch (err) {
      this.logger.error(`DocumentsService.retryFailedDocuments error: ${err.message}`, err.stack);
    } finally {
      await this.integrationCacheUtilsService.releaseLock(lockKey);
    }
  }

  private async retryDocumentUpload(document: Documents): Promise<void> {
    try {
      const signedUrl = await this.getSignedUrl(document.s3Key);
      let response: OkResponse = undefined;

      const defaultRequestPayload: PatientUploadFile = {
        fileName: document.originalName,
        scheduleCode: document.scheduleCode,
        fileUrl: signedUrl,
        description: document.description,
        mimeType: document.mimeType,
        hash: document.hash,
        extension: document.extension,
        appointmentTypeCode: document.appointmentTypeCode,
        fileTypeCode: document.fileTypeCode,
        patientCode: document.patientCode,
      };

      if (document.source === DocumentSourceType.patient_portal) {
        response = await this.integratorService.patientUploadScheduleFile(
          document.integrationId,
          defaultRequestPayload,
        );
      } else {
        const requestPayload: AgentUploadFile = {
          ...defaultRequestPayload,
          erpUsername: document.erpUsername,
        };

        response = await this.integratorService.agentUploadScheduleFile(document.integrationId, requestPayload);
      }

      const updateData = {
        retryCount: document.retryCount + 1,
        erpCreatedAt: response?.ok ? new Date() : null,
      };

      await this.documentsRepository.update({ id: document.id }, updateData);
    } catch (error) {
      await this.documentsRepository.update({ id: document.id }, { retryCount: document.retryCount + 1 });
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async retryFailedDocumentsCron(): Promise<void> {
    if (!shouldRunCron()) {
      return;
    }

    await this.retryFailedDocuments();
  }

  async getDocumentsCountForSchedule(integrationId: string, scheduleCode: string): Promise<number> {
    return await this.documentsRepository.count({
      where: { integrationId, scheduleCode, deletedAt: null },
    });
  }

  async listSimplifiedDocumentsForSchedule({
    integrationId,
    scheduleCode,
    patientCode,
  }: ListDocuments): Promise<SimplifiedDocument[]> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration?.documents?.enableDocumentsUpload) {
      return [];
    }

    return await this.documentsRepository.find({
      where: {
        integrationId,
        patientCode,
        scheduleCode,
        deletedAt: null,
      },
      select: ['id', 'originalName', 'fileTypeCode', 'createdAt', 'externalId'],
    });
  }

  async listPatientSchedules({
    integrationId,
    patientCpf,
    patientCode,
    erpUsername,
  }: ListPatientSchedules): Promise<Appointment[]> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration?.documents?.enableDocumentsUpload) {
      return [];
    }

    const [nextSchedules, patient] = await Promise.all([
      this.integratorService.listPatientSchedulesToUploadFile(integrationId, {
        patientCpf,
        erpUsername,
        patientCode,
      }),
      this.integratorService.getPatientByCode(integrationId, {
        code: patientCode,
        cpf: patientCpf,
      }),
    ]);

    const schedulesWithFiles = await Promise.all(
      nextSchedules.map(async (schedule: Appointment) => {
        const files = await this.listSimplifiedDocumentsForSchedule({
          integrationId,
          scheduleCode: schedule.appointmentCode,
          patientCode: patient.code,
        });

        return {
          ...schedule,
          files,
        };
      }),
    );

    return schedulesWithFiles;
  }

  async authenticatePatient({ integrationId, patientCpf, erpUsername }: AuthenticatePatient): Promise<string> {
    const integration = await this.integrationService.getOne(integrationId);

    if (!integration?.documents?.enableDocumentsUpload) {
      throw new BadRequestException({ ok: false, message: 'Document upload not enabled for this integration' });
    }

    const patient = await this.integratorService.getPatient(
      integrationId,
      {
        cpf: patientCpf,
      },
      true,
    );

    if (!patient?.code) {
      throw new BadRequestException({ ok: false, message: 'Patient not found' });
    }

    const data: PatientTokenData = {
      integrationId: castObjectIdToString(integrationId),
      patientCpf,
      patientCode: patient.code,
      patientName: patient.name,
      erpUsername,
    };

    return jwt.sign(data, process.env.DOCUMENTS_JWT_SECRET_KEY, {
      expiresIn: '1 day',
    });
  }
}
