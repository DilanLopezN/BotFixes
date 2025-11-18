import { Injectable } from '@nestjs/common';
import { INTEGRATIONS_CONNECTION_NAME } from '../../ormconfig';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulingEvents } from '../entities/scheduling-events.entity';
import { CreateSchedulingEvent } from '../interfaces/create-scheduling-event.interface';

@Injectable()
export class SchedulingEventsService {
  constructor(
    @InjectRepository(SchedulingEvents, INTEGRATIONS_CONNECTION_NAME)
    private schedulingEventsRepository: Repository<SchedulingEvents>,
  ) {}

  public async createEvent(data: CreateSchedulingEvent): Promise<void> {
    const schedulingEvent: Omit<SchedulingEvents, 'id' | 'createdAt'> = data;
    await this.schedulingEventsRepository.insert(schedulingEvent);
  }
}
