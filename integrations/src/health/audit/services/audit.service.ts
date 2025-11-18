import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from '../audit.entity';
import * as moment from 'moment';
import { IntegrationService } from '../../integration/integration.service';
import { INTEGRATIONS_CONNECTION_NAME } from '../../ormconfig';
import * as contextService from 'request-context';
import { CreateAuditDefault } from '../audit.interface';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../../events/events.service';
import { CacheService } from '../../../core/cache/cache.service';
import { uniqueId } from 'lodash';
import { shouldRunCron } from '../../../common/bootstrap-options';
import { KissbotEventType } from 'kissbot-core';

const AUDIT_BULK_INSERT_LIMIT = 30;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(Audit, INTEGRATIONS_CONNECTION_NAME)
    private auditRepository: Repository<Audit>,
    private integrationService: IntegrationService,
    private readonly eventsService: EventsService,
    private readonly cacheService: CacheService,
  ) {}

  public auditMetaData(): Partial<Audit> {
    const metadata = contextService.get('req:default-headers');

    return {
      conversationId: metadata?.conversationId || null,
      patientPhone: metadata?.memberId || null,
      ctxId: metadata?.ctxId || uniqueId(),
    };
  }

  public async sendAuditEvent(audit: CreateAuditDefault): Promise<void> {
    const metadata = this.auditMetaData();
    const integration = await this.integrationService.getOne(audit.integrationId);

    if (!integration?.auditRequests) {
      return;
    }

    await this.eventsService.dispatch(KissbotEventType.INTEGRATION_HEALTH_CREATE_AUDIT, {
      ...audit,
      ...metadata,
      createdAt: moment().valueOf(),
    });
  }

  public async createAudit(audits: CreateAuditDefault[]) {
    try {
      if (!audits?.length) {
        return;
      }

      return await this.auditRepository.save(audits);
    } catch (error) {
      this.logger.error('AuditService.createAudit', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  async processDeleteLogs() {
    if (!shouldRunCron()) return;
    await this.delete();
  }

  protected async delete(): Promise<void> {
    try {
      this.auditRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :expiration', { expiration: moment().subtract(2, 'months').valueOf() })
        .execute();
    } catch (error) {
      this.logger.error('AuditService.delete', error);
    }
  }

  public async queueAudits(audit: CreateAuditDefault) {
    try {
      const client = this.cacheService.getClient();
      const key = 'logs-audit:queue';
      const countKey = 'logs-audit:count';

      let count = parseInt((await client.get(countKey)) || '0', 10);

      await client.rpush(key, JSON.stringify(audit));
      count++;
      await client.set(countKey, count.toString());

      if (count < AUDIT_BULK_INSERT_LIMIT) {
        return;
      }

      const batchSize = 10;
      const batches = Math.ceil(count / batchSize);

      for (let i = 0; i < batches; i++) {
        const items = await client.lrange(key, 0, batchSize - 1);

        if (!items.length) break;

        await client.ltrim(key, items.length, -1);

        const batchAudits = JSON.parse(`[${items.join(',')}]`);
        await this.createAudit(batchAudits);
      }

      await client.set(countKey, '0');
    } catch (error) {
      this.logger.error('AuditService.queueAudits', error);
    }
  }
}
