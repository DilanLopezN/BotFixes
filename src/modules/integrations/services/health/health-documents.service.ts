import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as FormData from 'form-data';
import { lastValueFrom } from 'rxjs';
import { HealthIntegrationService } from './health-integration.service';
import { ExternalDataService } from './external-data.service';
import { HealthIntegration, IntegrationEnvironment } from '../../interfaces/health/health-integration.interface';
import {
    AuthenticatePatient,
    CheckDocumentUploadStatus,
    ListDocuments,
    ListDocumentTypes,
    ListPatientSchedules,
    UploadDocument,
} from '../../interfaces/health/health-documents.interface';
import { User } from '../../../users/interfaces/user.interface';

@Injectable()
export class HealthDocumentsService {
    constructor(
        private readonly httpService: HttpService,
        private readonly healthIntegrationService: HealthIntegrationService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async getIntegrationWithEnableDocumentsUpload(): Promise<HealthIntegration> {
        const integration = await this.healthIntegrationService.getModel().findOne({
            'documents.enableDocumentsUpload': true,
            environment: IntegrationEnvironment.production,
        });

        if (!integration?._id) {
            throw new BadRequestException({
                ok: false,
                message: 'No valid integration found for document upload',
                code: 'INTEGRATION_NOT_VALID',
            });
        }

        return integration as unknown as HealthIntegration;
    }

    async validateFeatureFlagAndUserErpUserName(_: string, user: User): Promise<void> {
        // const workspace = await this.externalDataService.getWorkspace(workspaceId);
        // if (!workspace?.featureFlag?.enableUploadErpDocuments) {
        //     throw new BadRequestException({
        //         ok: false,
        //         message: 'Integration document upload disabled',
        //         code: 'FEATURE_DISABLED',
        //     });
        // }

        if (!user?.erpUsername) {
            throw new BadRequestException({
                ok: false,
                message: 'Erp username not configured',
                code: 'ERP_USERNAME_UNSETTLED',
            });
        }
    }

    async uploadDocument(data: UploadDocument) {
        await this.validateFeatureFlagAndUserErpUserName(data.workspaceId, data.user);

        const { file, authToken } = data;
        const form = new FormData();

        form.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });

        form.append('scheduleCode', data.scheduleCode);
        form.append('description', data.description);
        form.append('fileTypeCode', data.fileTypeCode);
        form.append('appointmentTypeCode', data.appointmentTypeCode);

        if (data.externalId) {
            form.append('externalId', data.externalId);
        }

        try {
            const response = await lastValueFrom(
                this.httpService.request({
                    method: 'POST',
                    url: `/integration/health/documents/uploadDocument`,
                    headers: { ...form.getHeaders(), Authorization: authToken },
                    data: form,
                }),
            );
            return response?.data;
        } catch (error) {
            if (error?.response?.data) {
                return error?.response?.data;
            }

            throw error;
        }
    }

    async listDocuments(data: ListDocuments) {
        await this.validateFeatureFlagAndUserErpUserName(data.workspaceId, data.user);

        try {
            const response = await lastValueFrom(
                this.httpService.request({
                    method: 'POST',
                    url: `/integration/health/documents/listDocuments`,
                    data: {
                        scheduleCode: data.scheduleCode,
                    },
                    headers: { Authorization: data.authToken },
                }),
            );
            return response?.data;
        } catch (error) {
            if (error?.response?.data) {
                return error?.response?.data;
            }

            throw error;
        }
    }

    async listDocumentTypes(data: ListDocumentTypes) {
        await this.validateFeatureFlagAndUserErpUserName(data.workspaceId, data.user);

        try {
            const response = await lastValueFrom(
                this.httpService.request({
                    method: 'POST',
                    url: `/integration/health/documents/listDocumentTypes`,
                    headers: { Authorization: data.authToken },
                }),
            );
            return response?.data;
        } catch (error) {
            if (error?.response?.data) {
                return error?.response?.data;
            }

            throw error;
        }
    }

    async listPatientSchedules(data: ListPatientSchedules) {
        await this.validateFeatureFlagAndUserErpUserName(data.workspaceId, data.user);

        try {
            const response = await lastValueFrom(
                this.httpService.request({
                    method: 'POST',
                    url: `/integration/health/documents/listPatientSchedules`,
                    headers: { Authorization: data.authToken },
                }),
            );

            return (
                response?.data?.map((schedule) => ({
                    appointmentCode: schedule.appointmentCode,
                    appointmentDate: schedule.appointmentDate,
                    appointmentTypeCode: schedule.appointmentType?.code,
                    appointmentTypeName: schedule.appointmentType?.friendlyName,
                    doctorCode: schedule.doctor?.code,
                    doctorName: schedule.doctor?.friendlyName,
                    specialityCode: schedule.speciality?.code,
                    specialityName: schedule.speciality?.friendlyName,
                    procedureCode: schedule.procedure?.code,
                    procedureName: schedule.procedure?.friendlyName,
                    files: schedule.files,
                })) || []
            );
        } catch (error) {
            if (error?.response?.data) {
                return error?.response?.data;
            }

            throw error;
        }
    }

    async authenticatePatient(data: AuthenticatePatient): Promise<string> {
        const { user, patientCpf, workspaceId } = data;
        await this.validateFeatureFlagAndUserErpUserName(workspaceId, user);
        const integration = await this.getIntegrationWithEnableDocumentsUpload();

        try {
            const response = await lastValueFrom(
                this.httpService.request({
                    method: 'POST',
                    url: `/integration/${integration._id}/health/documents/authenticatePatient`,
                    data: {
                        patientCpf: patientCpf,
                        erpUsername: user.erpUsername,
                    },
                }),
            );

            return response?.data || null;
        } catch (error) {
            if (error?.response?.data) {
                return error?.response?.data;
            }

            throw error;
        }
    }

    async checkDocumentUploadStatus(data: CheckDocumentUploadStatus) {
        await this.validateFeatureFlagAndUserErpUserName(data.workspaceId, data.user);
        await this.getIntegrationWithEnableDocumentsUpload();

        return {
            ok: true,
            message: 'Document upload is enabled for this user and integration',
            enabled: true,
        };
    }
}
