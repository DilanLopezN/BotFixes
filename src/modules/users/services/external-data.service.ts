import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EmailSenderService } from '../../email-sender/services/email-sender.service';
import { SendEmailDto } from '../../email-sender/dto/send-email.dto';

@Injectable()
export class ExternalDataService {
    private emailSenderService: EmailSenderService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.emailSenderService = this.moduleRef.get<EmailSenderService>(EmailSenderService, { strict: false });
    }

    private getBaseUrl(): string {
        const env = process.env.NODE_ENV;
        if (env === 'local') {
            return 'http://localhost:8090';
        }
        if (env === 'production') {
            return 'https://app.botdesigner.io';
        }
        return 'https://dev-app.botdesigner.io';
    }

    async sendPasswordResetRequestEmail(
        workspaceId: string,
        email: string,
        userName: string,
        passwordResetRequestId: number,
        token: string,
    ): Promise<{ ok: boolean }> {
        const baseUrl = this.getBaseUrl();

        const data: SendEmailDto = {
            fromEmail: 'confirmacao@atend.clinic',
            fromTitle: 'Recuperação de Senha - Botdesigner',
            to: email,
            subject: 'Recuperação de Senha - Botdesigner',
            templateId: 'd-1e8bfd90378246faa779267e749c8dcc',
            templateData: {
                link_de_recuperacao: `${baseUrl}/v2/recover/password/${token}`,
                nome_do_destinatario: userName,
            },
            externalId: String(passwordResetRequestId),
        };
        return this.emailSenderService.sendEmail(workspaceId, data);
    }

    async sendMailResetRequestEmail(
        workspaceId: string,
        email: string,
        newMail: string,
        userName: string,

        mailResetRequestId: number,
        token: string,
    ): Promise<{ ok: boolean }> {
        const baseUrl = this.getBaseUrl();
        const data: SendEmailDto = {
            fromEmail: 'confirmacao@atend.clinic',
            fromTitle: 'Alteração de Email - Botdesigner',
            to: newMail,
            subject: 'Alteração de Email - Botdesigner',
            templateId: 'd-e9333b0af154477fbe7c829b905cb156',
            templateData: {
                link_de_ativacao: `${baseUrl}/v2/recover/email/${token}`,
                nome_do_destinatario: userName,
            },
            externalId: String(mailResetRequestId),
        };
        return this.emailSenderService.sendEmail(workspaceId, data);
    }

    async sendVerifyEmailRequestEmail(
        workspaceId: string,
        email: string,
        verifyEmailRequestId: number,
        token: string,
    ): Promise<{ ok: boolean }> {
        const baseUrl = this.getBaseUrl();
        const data: SendEmailDto = {
            fromEmail: 'confirmacao@atend.clinic',
            fromTitle: 'Verificação de Email',
            to: email,
            subject: 'Verificação de Email',
            templateId: 'd-e7ba12d140f14547a6230346f83f47aa',
            templateData: {
                verify_link: `${baseUrl}/v2/verify-email?token=${token}`,
            },
            externalId: String(verifyEmailRequestId),
        };
        return this.emailSenderService.sendEmail(workspaceId, data);
    }
}
