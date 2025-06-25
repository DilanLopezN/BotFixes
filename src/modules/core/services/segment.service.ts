import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { Segment } from '../models/segment.entity';
import { CORE_CONNECTION } from '../ormconfig';

@Injectable()
export class SegmentService {
    constructor(
        @InjectRepository(Segment, CORE_CONNECTION)
        private segmentRepository: Repository<Segment>,
    ) {}

    @CatchError()
    async listSegment(): Promise<Segment[]> {
        return await this.segmentRepository.createQueryBuilder().getMany();
    }
}
