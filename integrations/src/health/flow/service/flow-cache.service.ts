import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import moment from 'moment';
import { FlowAction } from '../interfaces/flow.interface';
import { MatchFlowActions } from '../interfaces/match-flow-actions';
import { castObjectIdToString } from '../../../common/helpers/cast-objectid';
import { CacheService } from '../../../core/cache/cache.service';

@Injectable()
export class FlowCacheService {
  private readonly logger = new Logger(FlowCacheService.name);
  private readonly MATCH_FLOW_ACTIONS_CACHE_TTL_SECONDS = 3 * 60;
  private readonly MATCH_FLOW_ACTIONS_CACHE_KEY_PREFIX = 'flow:cache:matchFlowsAndGetActions';

  constructor(private readonly cacheService: CacheService) {}

  private generateMatchFlowActionsCacheKey(params: MatchFlowActions): string | null {
    try {
      const integrationId = castObjectIdToString(params.integrationId);

      const cacheObject = {
        entitiesFilter: Object.keys(params.entitiesFilter || {})
          .sort()
          .reduce((acc, key) => {
            const entity = params.entitiesFilter[key];
            if (entity?._id) {
              acc[key] = castObjectIdToString(entity._id);
            }
            return acc;
          }, {}),
        filters: params.filters
          ? {
              periodOfDay: params.filters.periodOfDay ?? null,
              patientAge: params.filters.patientBornDate
                ? moment().diff(params.filters.patientBornDate, 'years')
                : null,
              patientSex: params.filters.patientSex ?? null,
              patientCpf: params.filters.patientCpf ?? null,
            }
          : null,
        targetFlowTypes: (params.targetFlowTypes || []).sort(),
        trigger: params.trigger ?? null,
        customFlowActions: params.customFlowActions?.length ? JSON.stringify(params.customFlowActions) : null,
      };

      const cacheString = JSON.stringify(cacheObject);
      const hash = createHash('sha256').update(cacheString).digest('hex');
      return `${this.MATCH_FLOW_ACTIONS_CACHE_KEY_PREFIX}:${integrationId}:${hash}`;
    } catch (error) {
      this.logger.warn('Failed to generate cache key for matchFlowActions', error);
      return null;
    }
  }

  public async getMatchFlowActionsCache(params: MatchFlowActions): Promise<FlowAction[] | null> {
    try {
      const cacheKey = this.generateMatchFlowActionsCacheKey(params);
      if (!cacheKey) {
        return null;
      }

      const cached = await this.cacheService.get(cacheKey);
      return cached ?? null;
    } catch (error) {
      this.logger.warn('Failed to get from cache', error);
      return null;
    }
  }

  public async setMatchFlowActionsCache(params: MatchFlowActions, data: FlowAction[]): Promise<void> {
    try {
      const cacheKey = this.generateMatchFlowActionsCacheKey(params);
      if (!cacheKey) {
        return;
      }

      await this.cacheService.set(data, cacheKey, this.MATCH_FLOW_ACTIONS_CACHE_TTL_SECONDS);
    } catch (error) {
      this.logger.warn('Failed to set cache', error);
    }
  }

  public async clearMatchFlowsAndGetActionsCacheByIntegrationId(integrationId: string): Promise<void> {
    try {
      const pattern = `${this.MATCH_FLOW_ACTIONS_CACHE_KEY_PREFIX}:${integrationId}:*`;
      await this.cacheService.removeKeysByPattern(pattern);
      this.logger.log(`Cleared matchFlowsAndGetActions cache for integration: ${integrationId}`);
    } catch (error) {
      this.logger.warn(`Failed to clear matchFlowsAndGetActions cache for integration ${integrationId}`, error);
    }
  }
}
