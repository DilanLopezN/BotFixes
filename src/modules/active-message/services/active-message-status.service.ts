import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { CatchError } from "../../auth/exceptions";
import { CreateActiveMessageStatusData } from "../interfaces/create-active-message-status-data.interface";
import { DeleteActiveMessageData } from "../interfaces/delete-active-message-status-data.interface";
import { UpdateActiveMessageStatusData } from "../interfaces/update-active-message-status-data.interface";
import { ActiveMessageStatus } from "../models/active-message-status.entity";
import { ACTIVE_MESSAGE_CONNECTION } from "../ormconfig";

@Injectable()
export class ActiveMessageStatusService {
    constructor(
        @InjectRepository(ActiveMessageStatus, ACTIVE_MESSAGE_CONNECTION)
        private statusRepository: Repository<ActiveMessageStatus>,
    ) {}

    @CatchError()
    async findStatusByWorkspaceId(workspaceId: string, statusCode: number) {
        return await this.statusRepository.findOne({
            workspaceId,
            statusCode,
        });
    }

    @CatchError()
    async listStatusByWorkspaceId(workspaceId: string) {
        return await this.statusRepository.find({
            workspaceId,
            global: 0,
        });
    }

    /**
     * Status globais default
     *  -1: INVALID_NUMBER;
     *  -2: START_OPEN_CONVERSATION;
     */
    @CatchError()
    async getGlobalStatus(statusCode: number) {
        return this.statusRepository.findOne({
            statusCode,
            global: 1,
        });
    }

    @CatchError()
    async createStatus(data: CreateActiveMessageStatusData) {
        return await this.statusRepository.save({
            ...data,
        });
    }

    @CatchError()
    async updateStatus(data: UpdateActiveMessageStatusData) {
        return await this.statusRepository.update(
            {
                id: data.id,
            },
            {
                statusCode: data.statusCode,
                statusName: data.statusName,
            },
        );
    }

    @CatchError()
    async deleteStatus(data: DeleteActiveMessageData) {
        return await this.statusRepository.delete({
            id: data.id,
            workspaceId: data.workspaceId,
            global: 0,
        });
    }

    /**
     * Função que retorna objectos parciais de active message status apenas com as propriedade id e statusCode
     * de acordo com um filtro de array do statusIdList.
     * @param statusIdList
     * @returns
     */
    async getStatusCodeByIdList(
        statusIdList: number[],
        workspaceId?: string,
    ): Promise<Pick<ActiveMessageStatus, 'id' | 'statusCode'>[]> {
        const whereCondition = {
            id: In(statusIdList),
        };
        if (workspaceId) {
            Object.assign(whereCondition, { workspaceId });
        }
        return (await this.statusRepository.find({
            where: whereCondition,
            select: ['id', 'statusCode'],
        })) as Pick<ActiveMessageStatus, 'id' | 'statusCode'>[];
    }
}