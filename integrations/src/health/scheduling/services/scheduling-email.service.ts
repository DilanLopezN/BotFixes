import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfirmationScheduleDataEmail } from '../interfaces/confirmation-schedule-data-email.interface';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { castObjectIdToString } from '../../../common/helpers/cast-objectid';
import { SchedulingLinksService } from './scheduling-links.service';

@Injectable()
export class SchedulingEmailService {
  constructor(private readonly schedulingLinksService: SchedulingLinksService) {}
  public async getAccessLinkScheduleResumeAndRedirect(
    integration: IntegrationDocument,
    { patientErpCode, scheduleCode }: ConfirmationScheduleDataEmail,
    link: string,
  ): Promise<string> {
    const dataShort = {
      integrationId: castObjectIdToString(integration._id),
      patientErpCode: patientErpCode,
      patientCpf: null,
      scheduleCode: scheduleCode,
      link: link,
    };

    const { scheduleResumeLink } =
      await this.schedulingLinksService.createSchedulingLinkGroupedByPatientErpCodeAndScheduleCode(
        integration,
        dataShort,
      );

    return scheduleResumeLink.shortLink;
  }

  public async getAccessLinkResumeAndRedirect(
    integration: IntegrationDocument,
    { patientErpCode, data, shortId }: ConfirmationScheduleDataEmail,
  ): Promise<string> {
    const token = jwt.sign(
      {
        data,
        integrationId: castObjectIdToString(integration._id),
        patientErpCode,
        url: process.env.INTEGRATIONS_URL,
        shortId,
      },
      process.env.SCHEDULING_JWT_SECRET_KEY,
      {
        expiresIn: '7 days',
      },
    );

    const url = process.env.SCHEDULING_APP_URL;
    return `${url}/resume?token=${token}`;
  }
}
