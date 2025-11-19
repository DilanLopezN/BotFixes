import { Injectable, Logger } from '@nestjs/common';
import { fromPairs, sortBy } from 'lodash';
import { CacheService } from '../../core/cache/cache.service';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import * as crypto from 'crypto';
import { EntityType, EntityTypes, IDoctorEntity } from '../interfaces/entity.interface';
import {
  ENTITIES_CACHE_EXPIRATION,
  PATIENT_CACHE_EXPIRATION,
  PATIENT_SCHEDULES_CACHE_EXPIRATION,
  PROCESSED_ENTITIES_CACHE_EXPIRATION,
  SCHEDULE_VALUE_CACHE_EXPIRATION,
  PATIENT_SCHEDULE_CONFIRMATION_CACHE_EXPIRATION,
  API_QUEUE_CACHE_EXPIRATION,
  LIST_SCHEDULES_TO_CONFIRM,
  EXTERNAL_ENTITIES_CACHE_EXPIRATION,
  PATIENT_SCHEDULES_GENERICS_CACHE_EXPIRATION,
} from './cache-expirations';
import { Patient } from '../interfaces/patient.interface';
import { Appointment, AppointmentValue, MinifiedAppointments } from '../interfaces/appointment.interface';
import { IntegrationEnvironment } from '../integration/interfaces/integration.interface';
import * as contextService from 'request-context';
import { castObjectIdToString } from '../../common/helpers/cast-objectid';
import { TypeOfService } from '../entities/schema';

export enum SCHEDULED_SENDING_STATUS {
  PROCESSING = 'processing',
  SENDED = 'sended',
  UPDATED = 'updated',
}

@Injectable()
export class IntegrationCacheUtilsService {
  private readonly logger = new Logger(IntegrationCacheUtilsService.name);
  constructor(private readonly cacheService: CacheService) {}

  public getRedisKey(integration: IntegrationDocument) {
    const envKey = integration.environment === IntegrationEnvironment.test ? 'TEST' : '';
    if (envKey) {
      return `${integration.type}-${envKey}:${castObjectIdToString(integration._id)}`;
    }
    return `${integration.type}:${castObjectIdToString(integration._id)}`;
  }

  public createCustomKey(identifier: string, value: string | { [key: string]: string }): string {
    if (typeof value === 'string') {
      return `${identifier}:${value}`;
    }

    const obj = fromPairs(sortBy(Object.keys(value ?? {})).map((chave) => [chave, value[chave]]));
    return `${identifier}:${crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex')}`;
  }

  private getPatientSchedulesCacheKey(integration: IntegrationDocument, patientCode: string) {
    return `${this.getRedisKey(integration)}:patient:${patientCode}:schedules`;
  }

  private getCachedEntitiesFromRequestKey(
    integration: IntegrationDocument,
    entityType: EntityType,
    requestFilters: any,
  ) {
    return this.createCustomKey(`${this.getRedisKey(integration)}:${entityType}`, requestFilters);
  }

  private getPatientCacheKey(
    integration: IntegrationDocument,
    patientCode?: string,
    patientCpf?: string,
    bornDate?: string,
  ) {
    if (patientCode && bornDate) {
      patientCode = `${patientCode}:${bornDate}`;
    }

    if (patientCpf && bornDate) {
      patientCpf = `${patientCpf}:${bornDate}`;
    }

    return `${this.getRedisKey(integration)}:patient:${patientCode || patientCpf}`;
  }

  public async getCachedEntitiesFromRequest(
    entityType: EntityType,
    integration: IntegrationDocument,
    requestFilters: any,
  ): Promise<EntityTypes[]> {
    try {
      const key = this.getCachedEntitiesFromRequestKey(integration, entityType, requestFilters);
      return await this.cacheService.get(key);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getCachedEntitiesFromRequest', error);
    }
  }

  public async setCachedEntitiesFromRequest(
    entityType: EntityType,
    integration: IntegrationDocument,
    requestFilters: any,
    resource: EntityTypes[],
    customEntitiesCacheExpiration?: number,
  ): Promise<void> {
    try {
      const key = this.getCachedEntitiesFromRequestKey(integration, entityType, requestFilters);
      await this.cacheService.set(resource, key, customEntitiesCacheExpiration ?? ENTITIES_CACHE_EXPIRATION);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setCachedEntitiesFromRequest', error);
    }
  }

  public async getPatientFromCache(
    integration: IntegrationDocument,
    patientCode?: string,
    patientCpf?: string,
    bornDate?: string,
  ): Promise<Patient> {
    try {
      const key = this.getPatientCacheKey(integration, patientCode, patientCpf, bornDate);
      return await this.cacheService.get(key);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getPatientFromCache', error);
    }
  }

  public async setCacheExternalEntities(
    integration: IntegrationDocument,
    entityType: EntityType,
    entities: IDoctorEntity[],
    customEntitiesCacheExpiration?: number,
  ): Promise<void> {
    try {
      const keyPattern = this.getRedisKey(integration);
      const key = `${keyPattern}:external-entities:${entityType}`;
      await this.cacheService.set(entities, key, customEntitiesCacheExpiration ?? EXTERNAL_ENTITIES_CACHE_EXPIRATION);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setCacheExternalEntities', error);
    }
  }

  public async getCacheExternalEntities(
    integration: IntegrationDocument,
    entityType: EntityType,
  ): Promise<IDoctorEntity[]> {
    try {
      const keyPattern = this.getRedisKey(integration);
      const key = `${keyPattern}:external-entities:${entityType}`;
      return await this.cacheService.get(key);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getCacheExternalEntities', error);
    }
  }

  public async removePatientFromCache(
    integration: IntegrationDocument,
    patientCode?: string,
    patientCpf?: string,
    bornDate?: string,
  ): Promise<void[]> {
    try {
      const key1 = this.getPatientCacheKey(integration, patientCode, undefined, bornDate);
      const key2 = this.getPatientCacheKey(integration, undefined, patientCpf, bornDate);
      return await Promise.all([this.cacheService.remove(key1), this.cacheService.remove(key2)]);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.removePatientFromCache', error);
    }
  }

  public async setPatientCache(
    integration: IntegrationDocument,
    patientCode: string,
    patientCpf: string,
    patient: Patient,
    bornDate?: string,
  ): Promise<void | void[]> {
    try {
      const key1 = this.getPatientCacheKey(integration, undefined, patientCpf, bornDate);
      const key2 = this.getPatientCacheKey(integration, patientCode, undefined, bornDate);

      if (patientCpf && !patientCode) {
        return await this.cacheService.set(patient, key1, PATIENT_CACHE_EXPIRATION);
      }

      if (patientCode && !patientCpf) {
        return await this.cacheService.set(patient, key2, PATIENT_CACHE_EXPIRATION);
      }

      return await Promise.all([
        this.cacheService.set(patient, key1, PATIENT_CACHE_EXPIRATION),
        this.cacheService.set(patient, key2, PATIENT_CACHE_EXPIRATION),
      ]);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setPatientCache', error);
    }
  }

  public async setPatientSchedulesGenericsCache<T>(
    integration: IntegrationDocument,
    patientCode: string,
    data: T,
    typeOfService: TypeOfService,
    expiration?: number,
  ): Promise<void> {
    try {
      const key = `${this.getRedisKey(integration)}:patient:${patientCode}:typeOfService:${typeOfService}:schedules_generics`;
      return await this.cacheService.set(data, key, expiration ?? PATIENT_SCHEDULES_GENERICS_CACHE_EXPIRATION);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setPatientSchedulesGenericsCache', error);
    }
  }

  public async getPatientSchedulesGenericsCache<T>(
    integration: IntegrationDocument,
    patientCode: string,
    typeOfService: TypeOfService,
  ): Promise<T> {
    try {
      const key = `${this.getRedisKey(integration)}:patient:${patientCode}:typeOfService:${typeOfService}:schedules_generics`;
      return await this.cacheService.get(key);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getPatientSchedulesGenericsCache', error);
    }
  }

  public async removePatientSchedulesGenericsCache(
    integration: IntegrationDocument,
    patientCode: string,
    typeOfService: TypeOfService,
  ): Promise<void> {
    try {
      const key = `${this.getRedisKey(integration)}:patient:${patientCode}:typeOfService:${typeOfService}:schedules_generics`;
      return await this.cacheService.remove(key);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.removePatientSchedulesGenericsCache', error);
    }
  }

  public async removePatientSchedulesCache(integration: IntegrationDocument, patientCode: string): Promise<void> {
    try {
      const key = this.getPatientSchedulesCacheKey(integration, patientCode);
      return await this.cacheService.remove(key);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.removePatientSchedulesCache', error);
    }
  }

  public async setPatientSchedulesCache(
    integration: IntegrationDocument,
    patientCode: string,
    data: {
      minifiedSchedules: MinifiedAppointments;
      schedules: Appointment[];
    },
  ): Promise<void> {
    try {
      const key = this.getPatientSchedulesCacheKey(integration, patientCode);
      return await this.cacheService.set(data, key, PATIENT_SCHEDULES_CACHE_EXPIRATION);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setPatientSchedulesCache', error);
    }
  }

  public async getPatientSchedulesCache(
    integration: IntegrationDocument,
    patientCode: string,
  ): Promise<{ minifiedSchedules: MinifiedAppointments; schedules: Appointment[] }> {
    try {
      const key = this.getPatientSchedulesCacheKey(integration, patientCode);
      return await this.cacheService.get(key);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getPatientSchedulesCache', error);
    }
  }

  public async setScheduleValueCache(
    integration: IntegrationDocument,
    requestFilters: any,
    data: AppointmentValue,
  ): Promise<void> {
    try {
      const scheduleValueKey = this.createCustomKey(`${this.getRedisKey(integration)}:scheduleValue`, requestFilters);
      return await this.cacheService.set(data, scheduleValueKey, SCHEDULE_VALUE_CACHE_EXPIRATION);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setScheduleValueCache', error);
    }
  }

  public async getScheduleValueCache(integration: IntegrationDocument, requestFilters: any): Promise<AppointmentValue> {
    try {
      const scheduleValueKey = this.createCustomKey(`${this.getRedisKey(integration)}:scheduleValue`, requestFilters);
      return await this.cacheService.get(scheduleValueKey);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getScheduleValueCache', error);
    }
  }

  private getProcessedEntitiesKey(
    integration: IntegrationDocument,
    entityType: EntityType,
    entitiesCodes?: string[],
  ): string {
    const defaultKey = `${this.getRedisKey(integration)}:processedEntities:${entityType}`;

    if (!entitiesCodes?.length) {
      return defaultKey;
    }

    const key = sortBy(entitiesCodes).join(':');
    return `${defaultKey}:${crypto.createHash('md5').update(key).digest('hex')}`;
  }

  public async setProcessedEntities(
    integration: IntegrationDocument,
    entityType: EntityType,
    data: EntityTypes[],
    entitiesCodes?: string[],
  ): Promise<void> {
    try {
      const processedEntitiesKey = this.getProcessedEntitiesKey(integration, entityType, entitiesCodes);
      return await this.cacheService.set(data, processedEntitiesKey, PROCESSED_ENTITIES_CACHE_EXPIRATION);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setProcessedEntities', error);
    }
  }

  public async getProcessedEntities(
    integration: IntegrationDocument,
    entityType: EntityType,
    entitiesCodes?: string[],
  ): Promise<EntityTypes[]> {
    try {
      const processedEntitiesKey = this.getProcessedEntitiesKey(integration, entityType, entitiesCodes);
      return await this.cacheService.get(processedEntitiesKey);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getProcessedEntities', error);
    }
  }

  public async getPatientTokenFromCache(integration: IntegrationDocument, identifier: string): Promise<string> {
    try {
      const patientCacheKey = `${this.getRedisKey(integration)}:patient-token:${identifier}`;
      return await this.cacheService.get(patientCacheKey);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getPatientTokenFromCache', error);
    }
  }

  public async removePatientTokenFromCache(integration: IntegrationDocument, identifier?: string): Promise<void> {
    try {
      const patientCacheKey = `${this.getRedisKey(integration)}:patient-token:${identifier}`;
      return await this.cacheService.remove(patientCacheKey);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.removePatientTokenFromCache', error);
    }
  }

  public async setPatientTokenCache(
    integration: IntegrationDocument,
    identifier: string,
    accessToken: string,
    expiration: number,
  ): Promise<void | void[]> {
    try {
      const patientCacheKey = `${this.getRedisKey(integration)}:patient-token:${identifier}`;
      return await this.cacheService.set(accessToken, patientCacheKey, expiration);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setPatientTokenCache', error);
    }
  }

  public async getPublicTokenFromCache(integration: IntegrationDocument): Promise<string> {
    try {
      const patientCacheKey = `${this.getRedisKey(integration)}:api-token`;
      return await this.cacheService.get(patientCacheKey);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getPublicTokenFromCache', error);
    }
  }

  public async removePublicTokenFromCache(integration: IntegrationDocument): Promise<void> {
    try {
      const publicTokenCacheKey = `${this.getRedisKey(integration)}:api-token`;
      return await this.cacheService.remove(publicTokenCacheKey);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.removePublicTokenFromCache', error);
    }
  }

  public async setPublicTokenCache(
    integration: IntegrationDocument,
    accessToken: string,
    expiration: number,
  ): Promise<void | void[]> {
    try {
      const publicTokenCacheKey = `${this.getRedisKey(integration)}:api-token`;
      return await this.cacheService.set(accessToken, publicTokenCacheKey, expiration);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setPublicTokenCache', error);
    }
  }

  public async removeAvailableSchedulesCache(integration: IntegrationDocument): Promise<void> {
    try {
      const { conversationId } = contextService.get('req:default-headers') || {};

      if (!conversationId) {
        return;
      }

      const cacheKeyPattern = `${this.getRedisKey(integration)}:TEMP_LIST_SCH:${conversationId}:*`;
      return await this.cacheService.removeKeysByPattern(cacheKeyPattern);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.removeAvailableSchedulesCache', error);
    }
  }

  public async getAvailableSchedulesCache(integration: IntegrationDocument, dataKey: any): Promise<any> {
    try {
      const { conversationId } = contextService.get('req:default-headers') || {};

      if (!conversationId) {
        return null;
      }

      const hash = crypto.createHash('sha256').update(JSON.stringify(dataKey)).digest('hex');
      const cacheKeyPattern = `${this.getRedisKey(integration)}:TEMP_LIST_SCH:${conversationId}:${hash}`;
      const data = await this.cacheService.get(cacheKeyPattern);
      return JSON.parse(data) as unknown;
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getAvailableSchedulesCache', error);
    }
  }

  public async setAvailableSchedulesCache(
    integration: IntegrationDocument,
    dataKey: any,
    data: any,
  ): Promise<void | void[]> {
    try {
      const { conversationId } = contextService.get('req:default-headers') || {};

      if (!conversationId) {
        return;
      }

      const hash = crypto.createHash('sha256').update(JSON.stringify(dataKey)).digest('hex');
      const cacheKeyPattern = `${this.getRedisKey(integration)}:TEMP_LIST_SCH:${conversationId}:${hash}`;
      await this.cacheService.set(JSON.stringify(data), cacheKeyPattern, 120);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setAvailableSchedulesCache', error);
    }
  }

  public getApiQueueCache(integration: IntegrationDocument, id: string): Promise<string> {
    const key = `api-queue:${integration._id.toString()}_${id}`;
    try {
      return this.cacheService.get(key);
    } catch (error) {
      this.logger.error(`IntegrationCacheUtilsService.${this.getApiQueueCache.name}`, error);
    }
  }

  public removeApiQueueCache(integration: IntegrationDocument, id: string): Promise<void> {
    try {
      const key = `api-queue:${integration._id.toString()}_${id}`;
      return this.cacheService.remove(key);
    } catch (error) {
      this.logger.error(`IntegrationCacheUtilsService.${this.removeApiQueueCache.name}`, error);
    }
  }

  public setApiQueueCache(integration: IntegrationDocument, id: string, status: string): Promise<void> {
    try {
      const key = `api-queue:${integration._id.toString()}_${id}`;
      return this.cacheService.set(status, key, API_QUEUE_CACHE_EXPIRATION);
    } catch (error) {
      this.logger.error(`IntegrationCacheUtilsService.${this.setApiQueueCache.name}`, error);
    }
  }

  public async setPatientSchedulesToConfirmCache(
    integration: IntegrationDocument,
    scheduleCode: string,
    patientCode: string,
    schedule: any,
  ): Promise<void> {
    try {
      if (!integration || !scheduleCode || !patientCode) {
        throw new Error('Integration, scheduleCode and patientCode are required');
      }
      const key = `patient-schedule-confirmation:${castObjectIdToString(integration._id)}_${scheduleCode}:${patientCode}`;
      return await this.cacheService.set(schedule, key, PATIENT_SCHEDULE_CONFIRMATION_CACHE_EXPIRATION);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setPatientSchedulesToConfirmCache', error);
    }
  }

  public async getPatientSchedulesToConfirmCache(
    integration: IntegrationDocument,
    scheduleCode: string,
    patientCode: string,
  ): Promise<any> {
    try {
      if (!integration || !scheduleCode || !patientCode) {
        throw new Error('Integration, scheduleCode and patientCode are required');
      }
      const key = `patient-schedule-confirmation:${castObjectIdToString(integration._id)}_${scheduleCode}:${patientCode}`;
      return await this.cacheService.get(key);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getPatientSchedulesToConfirmCache', error);
    }
  }

  public async setListSchedulesConfirmationCache(
    integration: IntegrationDocument,
    key1: string,
    key2: string,
    schedule: any,
    customTtl?: number,
  ): Promise<void> {
    try {
      if (!integration || !key1 || !key2) {
        throw new Error('Integration, and keys are required');
      }

      const cacheKey = `LIST_SCHEDULES_TO_CONFIRM_KEY:${integration._id}_${key1}_${key2}`;
      const ttl = customTtl ?? LIST_SCHEDULES_TO_CONFIRM;

      return await this.cacheService.set(schedule, cacheKey, ttl);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.setListSchedulesConfirmationCache', error);
    }
  }

  public async getListSchedulesConfirmationCache(
    integration: IntegrationDocument,
    key1: string,
    key2: string,
  ): Promise<any> {
    try {
      if (!integration || !key1 || !key2) {
        throw new Error('Integration, and keys are required');
      }
      const cacheKey = `LIST_SCHEDULES_TO_CONFIRM_KEY:${integration._id}_${key1}_${key2}`;
      return await this.cacheService.get(cacheKey);
    } catch (error) {
      this.logger.error('IntegrationCacheUtilsService.getListSchedulesConfirmationCache', error);
    }
  }

  public removeListSchedulesConfirmationCache(
    integration: IntegrationDocument,
    key1: string,
    key2: string,
  ): Promise<void> {
    try {
      const cacheKey = `LIST_SCHEDULES_TO_CONFIRM_KEY:${integration._id}_${key1}_${key2}`;
      return this.cacheService.remove(cacheKey);
    } catch (error) {
      this.logger.error(`IntegrationCacheUtilsService.${this.removeApiQueueCache.name}`, error);
    }
  }

  public async acquireLock(lockKey: string, ttlSeconds: number): Promise<boolean> {
    try {
      const redisClient = this.cacheService.getClient();
      if (!redisClient) {
        this.logger.error('Cliente Redis não disponível');
        return false;
      }

      const lockAcquired = await redisClient.setnx(lockKey, 'locked');
      if (lockAcquired) {
        await redisClient.expire(lockKey, ttlSeconds);
      }

      return Boolean(lockAcquired);
    } catch (error) {
      this.logger.error(`Erro ao adquirir lock ${lockKey}: ${error.message}`);
      return false;
    }
  }

  public async releaseLock(lockKey: string): Promise<void> {
    try {
      const redisClient = this.cacheService.getClient();
      if (redisClient) {
        await redisClient.del(lockKey);
      }
    } catch (error) {
      this.logger.error(`Erro ao liberar lock ${lockKey}: ${error.message}`);
    }
  }
}
