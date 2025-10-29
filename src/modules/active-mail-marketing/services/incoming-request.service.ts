import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomingRequest } from '../models/incoming-request.entity';
import { ACTIVE_MAIL_MARKETING_CONNECTION } from '../ormconfig';

@Injectable()
export class IncomingRequestService {
    constructor(
        @InjectRepository(IncomingRequest, ACTIVE_MAIL_MARKETING_CONNECTION)
        private readonly incomingRequestRepository: Repository<IncomingRequest>,
    ) {}

    async create(data: Partial<IncomingRequest>): Promise<IncomingRequest> {
        const incomingRequest = this.incomingRequestRepository.create(data);
        return await this.incomingRequestRepository.save(incomingRequest);
    }

    async findByRequestId(requestId: string): Promise<IncomingRequest | null> {
        return await this.incomingRequestRepository.findOne({
            where: { requestId },
        });
    }

    async findByRequestIdOrFail(requestId: string): Promise<IncomingRequest> {
        const incomingRequest = await this.findByRequestId(requestId);
        if (!incomingRequest) {
            throw new NotFoundException('Incoming request not found');
        }
        return incomingRequest;
    }

    async updateById(id: string, data: Partial<IncomingRequest>): Promise<void> {
        await this.incomingRequestRepository.update(id, data);
    }

    async updateByRequestId(requestId: string, data: Partial<IncomingRequest>): Promise<void> {
        const incomingRequest = await this.findByRequestIdOrFail(requestId);
        await this.updateById(incomingRequest.id, data);
    }

    async markAsCompleted(requestId: string, processedCount: number, errorCount: number): Promise<void> {
        await this.updateByRequestId(requestId, {
            status: 'completed',
            processedCount,
            errorCount,
            processedAt: new Date(),
        });
    }

    async markAsFailed(requestId: string): Promise<void> {
        const incomingRequest = await this.findByRequestId(requestId);
        if (incomingRequest) {
            await this.updateById(incomingRequest.id, {
                status: 'failed',
                processedAt: new Date(),
            });
        }
    }

    async findByCampaignId(campaignId: string): Promise<IncomingRequest[]> {
        return await this.incomingRequestRepository.find({
            where: { campaignId },
            order: { createdAt: 'DESC' },
        });
    }

    async findByWorkspaceId(workspaceId: string): Promise<IncomingRequest[]> {
        return await this.incomingRequestRepository.find({
            where: { workspaceId },
            order: { createdAt: 'DESC' },
        });
    }

    async findPendingRequests(): Promise<IncomingRequest[]> {
        return await this.incomingRequestRepository.find({
            where: { status: 'pending' },
            order: { createdAt: 'ASC' },
        });
    }

    async getStatsByCampaignId(campaignId: string): Promise<{
        total: number;
        pending: number;
        completed: number;
        failed: number;
    }> {
        const requests = await this.findByCampaignId(campaignId);

        return {
            total: requests.length,
            pending: requests.filter((r) => r.status === 'pending').length,
            completed: requests.filter((r) => r.status === 'completed').length,
            failed: requests.filter((r) => r.status === 'failed').length,
        };
    }
}
