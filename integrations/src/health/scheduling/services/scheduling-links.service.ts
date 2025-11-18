import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { INTEGRATIONS_CONNECTION_NAME } from '../../ormconfig';
import { SchedulingLinks } from '../entities/scheduling-links.entity';
import { ISchedulingLinks } from '../interfaces/scheduling-links.interface';
import { generateRandomHash } from '../../../common/helpers/hash';
import { IntegrationDocument } from '../../integration/schema/integration.schema';

type CreateScheduleLinkByPatientErpCodeAndScheduleCode = Omit<ISchedulingLinks, 'id' | 'createdAt' | 'shortId'> & {
  scheduleCode: string;
};

interface BuildSchedulingLink {
  shortLink: string;
  shortPathLink: string;
}

interface CreatedSchedulingLinks {
  scheduleResumeLink: BuildSchedulingLink;
  patientResumeLink: BuildSchedulingLink;
}

@Injectable()
export class SchedulingLinksService {
  constructor(
    @InjectRepository(SchedulingLinks, INTEGRATIONS_CONNECTION_NAME)
    private schedulingLinksRepository: Repository<SchedulingLinks>,
  ) {}

  public async getScheduleByShortId(shortId: string): Promise<SchedulingLinks> {
    return await this.schedulingLinksRepository.findOne({
      where: {
        shortId,
      },
    });
  }

  public async getScheduleById(schedulingLinkId: number): Promise<SchedulingLinks> {
    return await this.schedulingLinksRepository.findOne({
      where: {
        id: schedulingLinkId,
      },
    });
  }

  public buildSchedulingAccessLink(shortId: string): BuildSchedulingLink {
    const url = process.env.SCHEDULING_LINK_BASE_URL;

    return {
      shortLink: `${url}/b/${shortId}`,
      shortPathLink: `b/${shortId}`,
    };
  }

  public async createSchedulingLinkGroupedByPatientErpCodeAndScheduleCode(
    integration: IntegrationDocument,
    data: CreateScheduleLinkByPatientErpCodeAndScheduleCode,
  ): Promise<CreatedSchedulingLinks> {
    if (!integration.scheduling?.active) {
      return {
        scheduleResumeLink: null,
        patientResumeLink: null,
      };
    }

    const { patientErpCode, scheduleCode } = data;

    const scheduleLinks = await this.schedulingLinksRepository
      .createQueryBuilder()
      .where('integration_id = :integrationId', { integrationId: data.integrationId })
      .andWhere('patient_erp_code = :patientErpCode', { patientErpCode })
      .andWhere('link = :link', { link: data.link })
      .andWhere(
        new Brackets((qb) => {
          qb.where('schedule_code = :scheduleCode', { scheduleCode }).orWhere('schedule_code is NULL');
        }),
      )
      .getMany();

    const scheduleLinkByScheduleCode = scheduleLinks?.find((scheduleLink) => scheduleLink.scheduleCode);
    const scheduleLinkByPatient = scheduleLinks.find((scheduleLink) => !scheduleLink.scheduleCode);

    if (scheduleLinkByScheduleCode) {
      return {
        scheduleResumeLink: this.buildSchedulingAccessLink(scheduleLinkByScheduleCode.shortId),
        patientResumeLink: this.buildSchedulingAccessLink(scheduleLinkByPatient.shortId),
      };
    }

    const newScheduleLinkByScheduleCode: Omit<ISchedulingLinks, 'id' | 'createdAt'> = {
      ...data,
      shortId: generateRandomHash(10),
    };

    const newScheduleLinkByPatientErpCode: Omit<ISchedulingLinks, 'id' | 'createdAt'> = {
      ...data,
      scheduleCode: undefined,
      shortId: generateRandomHash(10),
    };

    const linksToCreate = [newScheduleLinkByScheduleCode];

    if (!scheduleLinkByPatient) {
      linksToCreate.push(newScheduleLinkByPatientErpCode);
    }

    const [linkScheduleCode, linkPatient] = await this.schedulingLinksRepository.save(linksToCreate);

    return {
      scheduleResumeLink: this.buildSchedulingAccessLink(linkScheduleCode.shortId),
      patientResumeLink: this.buildSchedulingAccessLink(linkPatient?.shortId || scheduleLinkByPatient?.shortId),
    };
  }

  public async upsert(entities: Omit<SchedulingLinks, 'id'>[]) {
    await this.schedulingLinksRepository.createQueryBuilder().insert().values(entities).orIgnore().execute();
  }
}
