import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EMAIL_CONNECTION } from '../ormconfig';
import * as sgMail from '@sendgrid/mail';
import * as sgClient from '@sendgrid/client';
import { EmailSendingSetting } from '../models/email-sending-setting.entity';
import { CreateEmailSendingSettingDto, UpdateEmailSendingSettingDto } from '../dto/email-sending-setting.dto';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { uniq } from 'lodash';

export class EmailSendingSettingService {
    constructor(
        @InjectRepository(EmailSendingSetting, EMAIL_CONNECTION)
        private emailSendingSettingRepository: Repository<EmailSendingSetting>,
    ) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
        sgClient.setApiKey(process.env.SENDGRID_API_KEY as string);
    }

    @CatchError()
    async create(workspaceId: string, data: CreateEmailSendingSettingDto) {
        const { templateVariables } = await this.validateTemplateSendGrid(data.templateId, data.versionId);
        const { variables } = this.getVariablesInTemplate(templateVariables, data.templateVariables);

        return await this.emailSendingSettingRepository.save({
            enabled: data.enabled,
            settingName: data.settingName,
            templateId: data.templateId,
            versionId: data.versionId,
            emailType: data.emailType,
            templateVariables: variables,
            workspaceId,
        });
    }

    @CatchError()
    async update(workspaceId: string, id: number, data: UpdateEmailSendingSettingDto) {
        const emailSetting = await this.emailSendingSettingRepository.findOne(id);

        if (!emailSetting) {
            throw Exceptions.EMAIL_SENDING_SETTING_NOT_FOUND;
        }

        const { templateVariables } = await this.validateTemplateSendGrid(data.templateId, data.versionId);
        const { variables } = this.getVariablesInTemplate(templateVariables, data.templateVariables);

        return await this.emailSendingSettingRepository.save({
            id,
            enabled: data.enabled,
            settingName: data.settingName,
            templateId: data.templateId,
            versionId: data.versionId,
            emailType: data.emailType,
            templateVariables: variables,
            workspaceId,
        });
    }

    @CatchError()
    async softDelete(workspaceId: string, id: number) {
        const result = await this.emailSendingSettingRepository.softDelete({
            workspaceId,
            id,
        });

        return { ok: !!result.affected };
    }

    async validateTemplateSendGrid(templateId: string, versionId: string) {
        const template = await sgClient
            .request({ url: `/v3/templates/${templateId}`, method: 'GET' })
            .then(([response]) => {
                if (response.body) {
                    return response.body;
                }
                return null;
            })
            .catch((error) => {
                console.log('ERROR EmailSenderService.getTemplateSendGridById: ', error);
                return null;
            });

        if (!template) {
            throw Exceptions.TEMPLATE_EMAIL_NOT_FOUND;
        }

        const templateVersion = template?.versions?.find((version) => version?.id === versionId);

        if (!templateVersion) {
            throw Exceptions.TEMPLATE_EMAIL_VERSION_NOT_FOUND;
        }

        const templateVariables = [];
        const content = templateVersion?.plain_content as string;

        if (content) {
            // Encontra todos os {{...}}
            const matches = content.match(/{{(.*?)}}/g) || [];

            matches.forEach((match: string) => {
                const cleanMatch = match.replace(/[{}]/g, '').trim();

                // Filtra apenas variáveis, excluindo:
                // - Condicionais: #if, /if, else
                // - Loops: #each, /each
                // - Comentários que começam com !
                // - Helpers que começam com #
                if (
                    !cleanMatch.startsWith('#') && // Remove helpers (#if, #each, etc)
                    !cleanMatch.startsWith('/') && // Remove fechamentos (/if, /each, etc)
                    !cleanMatch.startsWith('!') && // Remove comentários
                    cleanMatch !== 'else' && // Remove else
                    !cleanMatch.includes('..') && // Remove referências de contexto (..)
                    !cleanMatch.startsWith('@') && // Remove variáveis de contexto (@index)
                    !cleanMatch.startsWith('this.') // Remove variáveis que começam com this.
                ) {
                    // Adiciona apenas se não estiver já na lista
                    if (!templateVariables.includes(cleanMatch as never)) {
                        templateVariables.push(cleanMatch as never);
                    }
                }
            });
        }

        return { template, templateVersion, templateVariables: uniq(templateVariables) };
    }

    getVariablesInTemplate(templateVariables: string[], dataVariables: Record<string, string>) {
        let variables = null;
        // permite criar apenas variaveis que estejam incluidas no template
        if (dataVariables && typeof dataVariables == 'object' && !!Object.keys(dataVariables)?.length) {
            variables = Object.entries(dataVariables).reduce((acc, [key, value]) => {
                if (templateVariables.includes(key)) {
                    acc[key] = String(value);
                }
                return acc;
            }, {});
        }

        return { variables };
    }

    async getEmailSendingSettingByWorkspaceIdAndId(workspaceId: string, id: number) {
        return await this.emailSendingSettingRepository.findOne({ workspaceId: workspaceId, id: id });
    }

    async getEmailSendingSettingsByWorkspaceId(workspaceId: string) {
        return await this.emailSendingSettingRepository.find({ workspaceId: workspaceId });
    }

    async getTemplateVariableKeys(templateId: string, version: string): Promise<String[]> {
        try {
            const { templateVariables } = await this.validateTemplateSendGrid(templateId, version);

            return templateVariables || [];
        } catch (error) {
            console.log('ERROR EmailSendingSettingService.getTemplateVariableKeys: ', error);
            return [];
        }
    }
}
