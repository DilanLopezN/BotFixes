import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as moment from 'moment';
import { IntegratorService } from '../../integrator/service/integrator.service';
import { ListSchedulesToConfirmV2 } from '../../integrator/interfaces';
import { SchedulingLinksService } from '../../scheduling/services/scheduling-links.service';
import { ConfirmationSchedule, ConfirmationScheduleDataV2 } from '../../interfaces/confirmation-schedule.interface';
import { SchedulingLinks } from '../../scheduling/entities/scheduling-links.entity';

@Injectable()
export class ScheduleNotificationService {
  constructor(
    private readonly integratorService: IntegratorService,
    private readonly schedulingLinksService: SchedulingLinksService,
  ) {}

  async listScheduleNotifications(
    integrationId: string,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    const content = await this.integratorService.listSchedulesToConfirm(integrationId, data);
    const schedulingLinks: Omit<SchedulingLinks, 'id'>[] = [];

    content.data = content.data?.map((data: ConfirmationScheduleDataV2) => {
      const { schedule, contact } = data;

      const shortId = crypto
        .createHash('sha256')
        .update(`${contact.code}_${schedule.scheduleCode}_notification`)
        .digest('hex')
        .substring(0, 10);

      schedulingLinks.push({
        integrationId,
        patientErpCode: contact.code,
        patientCpf: null,
        scheduleCode: schedule.scheduleCode,
        link: 'resume', // deve cair na listagem de agendamentos no front e não dentro de um agendamento específico
        shortId,
        createdAt: moment().toDate(),
        expiration: moment().add(3, 'day').toISOString(),
      } as Omit<SchedulingLinks, 'id'>);

      const { shortLink, shortPathLink } = this.schedulingLinksService.buildSchedulingAccessLink(shortId);

      if (!data.schedule?.data) {
        data.schedule.data = {};
      }

      data.schedule.data = {
        ...data.schedule.data,
        shortId,
        PREPARO_URL: shortLink,
        URL_0: shortPathLink,
      };

      return data;
    });

    await this.schedulingLinksService.upsert(schedulingLinks);

    return content;
  }
}
