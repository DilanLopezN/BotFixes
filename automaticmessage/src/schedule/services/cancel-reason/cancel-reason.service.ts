import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CancelReason } from '../../models/cancel-reason.entity';
import { SCHEDULE_CONNECTION_NAME } from '../../connName';
import {
  CreateCancelReasonDto,
  UpdateCancelReasonDto,
} from '../../dto/cancel-reason.dto';
import { ListScheduleCancelReasonParams } from '../../interfaces/list-schedule-cancel-reason.interface';
import { CatchError } from '../../../miscellaneous/exceptions';
import {
  DefaultRequest,
  DefaultResponse,
} from '../../../miscellaneous/interfaces';

@Injectable()
export class CancelReasonService {
  constructor(
    @InjectRepository(CancelReason, SCHEDULE_CONNECTION_NAME)
    private cancelReasonRepository: Repository<CancelReason>,
  ) {}

  @CatchError()
  async listByWorkspaceId(workspaceId: string) {
    return await this.cancelReasonRepository.find({ where: { workspaceId } });
  }

  @CatchError()
  async getCancelReasons(
    workspaceId: string,
    query?: DefaultRequest<ListScheduleCancelReasonParams>,
  ): Promise<DefaultResponse<CancelReason[]>> {
    const skip = query?.skip ?? 0;
    const limit = query?.limit ?? 4;
    const data = query?.data;

    let q = await this.cancelReasonRepository
      .createQueryBuilder('cancelReason')
      .where('cancelReason.workspace_id = :workspaceId', { workspaceId })
      .skip(skip)
      .take(limit)
      .orderBy('cancelReason.id', 'DESC');

    if (data?.name) {
      q = q.andWhere(
        `unaccent(LOWER(cancelReason.reason_name)) LIKE unaccent(LOWER(:name))`,
        { name: `%${data.name}%` },
      );
    }

    const [result, count] = await q.getManyAndCount();

    return {
      metadata: {
        count,
        skip,
        limit,
      },
      data: result,
    };
  }

  @CatchError()
  async findOne(id: number) {
    return await this.cancelReasonRepository.findOne({ where: { id } });
  }

  @CatchError()
  async findCancelReasonByWorkspaceIdAndIds(
    workspaceId: string,
    reasonIds: number[],
  ) {
    if (!reasonIds?.length) {
      return [];
    }

    return await this.cancelReasonRepository
      .createQueryBuilder('cancelReason')
      .where('cancelReason.workspaceId = :workspaceId', { workspaceId })
      .andWhere('cancelReason.id IN (:...reasonIds)', { reasonIds })
      .getMany();
  }

  @CatchError()
  async createCancelReason(workspaceId: string, data: CreateCancelReasonDto) {
    return await this.cancelReasonRepository.save({
      ...data,
      workspaceId,
    });
  }

  @CatchError()
  async updateCancelReason(
    workspaceId: string,
    id: number,
    data: UpdateCancelReasonDto,
  ) {
    const result = await this.cancelReasonRepository.update(
      { id: id, workspaceId },
      {
        reasonName: data.reasonName,
      },
    );

    return result.affected > 0 ? { ok: true } : { ok: false };
  }
}
