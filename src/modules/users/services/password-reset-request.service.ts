import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordResetRequest } from '../models/password-reset-request.entity';
import { MoreThan, Repository } from 'typeorm';
import { USER_CONNECTION } from '../ormconfig';

export const PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS = 4;

@Injectable()
export class PasswordResetRequestService {
    constructor(
        @InjectRepository(PasswordResetRequest, USER_CONNECTION)
        protected readonly repository: Repository<PasswordResetRequest>,
    ) {}

    public async create(userId: string) {
        const token = crypto.randomBytes(32).toString('hex');

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS);

        const resetRequest = this.repository.create({
            userId,
            token,
            expiresAt,
        });

        return await this.repository.save(resetRequest);
    }

    public async findByToken(token: string): Promise<PasswordResetRequest> {
        return await this.repository.findOne({ where: { token } });
    }

    public async finalizePasswordResetRequest(
        passwordResetRequest: PasswordResetRequest,
    ): Promise<PasswordResetRequest> {
        passwordResetRequest.resetedAt = new Date();
        return await this.repository.save(passwordResetRequest);
    }

    public async hasOpenResetRequest(userId: string): Promise<Boolean> {
        const result = await this.repository.count({
            where: { userId, resetedAt: null, expiresAt: MoreThan(new Date()) },
        });
        return !!result;
    }
}
