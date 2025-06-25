import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { USER_CONNECTION } from '../ormconfig';
import { VerifyEmailRequest } from '../models/verify-email-request.entity';

export const MAIL_RESET_REQUEST_EXPIRATION_IN_HOURS = 4;

@Injectable()
export class MailResetRequestService {
    constructor(
        @InjectRepository(VerifyEmailRequest, USER_CONNECTION)
        protected readonly repository: Repository<VerifyEmailRequest>,
    ) {}

    public async create(userId: string, email: string) {
        const token = crypto.randomBytes(32).toString('hex');

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + MAIL_RESET_REQUEST_EXPIRATION_IN_HOURS);

        const resetRequest = this.repository.create({
            userId,
            token,
            expiresAt,
            email,
        });

        return await this.repository.save(resetRequest);
    }

    public async findByToken(token: string): Promise<VerifyEmailRequest> {
        return await this.repository.findOne({ where: { token } });
    }

    public async finalizeMailRequestService(mailResetRequest: VerifyEmailRequest): Promise<VerifyEmailRequest> {
        const mailRequestEndServiceDate = new Date();
        mailResetRequest.resetedAt = mailRequestEndServiceDate;
        mailResetRequest.verifiedAt = mailRequestEndServiceDate;
        return await this.repository.save(mailResetRequest);
    }

    public async hasOpenResetRequest(userId: string): Promise<Boolean> {
        const result = await this.repository.count({
            where: { userId, resetedAt: null },
        });

        if (result >= 1) {
            return true;
        }

        return false;
    }
}
