import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { VerifyEmailRequest } from '../models/verify-email-request.entity';
import { MoreThan, Repository } from 'typeorm';
import { USER_CONNECTION } from '../ormconfig';

export const VERIFY_EMAIL_REQUEST_EXPIRATION_IN_HOURS = 4;

@Injectable()
export class VerifyEmailRequestService {
    constructor(
        @InjectRepository(VerifyEmailRequest, USER_CONNECTION)
        protected readonly repository: Repository<VerifyEmailRequest>,
    ) {}

    public async create(userId: string) {
        const token = crypto.randomBytes(32).toString('hex');

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + VERIFY_EMAIL_REQUEST_EXPIRATION_IN_HOURS);

        const resetRequest = this.repository.create({
            userId,
            token,
            expiresAt,
        });

        return await this.repository.save(resetRequest);
    }

    public async findByToken(token: string): Promise<VerifyEmailRequest> {
        return await this.repository.findOne({ where: { token } });
    }

    public async finalizeVerifyEmailRequest(verifyEmailRequest: VerifyEmailRequest): Promise<VerifyEmailRequest> {
        verifyEmailRequest.verifiedAt = new Date();
        return await this.repository.save(verifyEmailRequest);
    }

    public async hasOpenVerifyEmailRequest(userId: string): Promise<Boolean> {
        const result = await this.repository.count({
            where: { userId, verifiedAt: null, expiresAt: MoreThan(new Date()) },
        });
        return !!result;
    }
}
