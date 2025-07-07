import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment, AppointmentStatus } from 'kissbot-entities';
import { Repository } from 'typeorm';
import { ANALYTICS_CONNECTION } from '../../consts';

@Injectable()
export class HealthAnalyticsService {
  constructor(
    @InjectRepository(Appointment, ANALYTICS_CONNECTION)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  public async upsert(_: string, appointment: Appointment) {
    const savedAppointment = await this.appointmentRepository.findOne({
      conversationId: appointment.conversationId,
      ctx_id: appointment.ctx_id,
    });

    if (!savedAppointment) {
      return await this.appointmentRepository
        .createQueryBuilder()
        .insert()
        .values(appointment)
        .execute();
    }

    if (savedAppointment?.appointmentStatus === AppointmentStatus.scheduled) {
      return;
    }

    return await this.appointmentRepository
      .createQueryBuilder()
      .update()
      .set(appointment)
      .where('id = :id', {
        id: savedAppointment.id,
      })
      .execute();
  }

  public async updateByCtxId(_: string, appointment: Partial<Appointment>) {
    return await this.appointmentRepository
      .createQueryBuilder()
      .update()
      .set(appointment)
      .where('conversationId = :conversationId AND ctx_id = :ctxId', {
        conversationId: appointment.conversationId,
        ctxId: appointment.ctx_id,
      })
      .execute();
  }
}
