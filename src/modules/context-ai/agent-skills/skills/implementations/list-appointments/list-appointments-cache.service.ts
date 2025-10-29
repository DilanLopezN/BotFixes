import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../../../common/redis/redis.service';
import * as Redis from 'ioredis';
import { Appointment } from './list-appointments.interfaces';

@Injectable()
export class ListAppointmentsCacheService {
    private readonly logger = new Logger(ListAppointmentsCacheService.name);
    private readonly redis: Redis.Redis;

    private readonly PATIENT_CACHE_PREFIX = 'list_appointments:patient:';
    private readonly APPOINTMENTS_CACHE_PREFIX = 'list_appointments:appointments:';
    private readonly PATIENT_CACHE_TTL = 24 * 60 * 60; // 24 hours
    private readonly APPOINTMENTS_CACHE_TTL = 5 * 60; // 5 minutes

    constructor(private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient();
    }

    async cachePatientData(
        sessionId: string,
        patientData: {
            cpf: string;
            birthDate: string;
            code?: string;
            name?: string;
        },
    ): Promise<void> {
        const key = this.getPatientCacheKey(sessionId);
        await this.redis.setex(key, this.PATIENT_CACHE_TTL, JSON.stringify(patientData));
    }

    async getCachedPatientData(sessionId: string): Promise<{
        cpf: string;
        birthDate: string;
        code?: string;
        name?: string;
    } | null> {
        const key = this.getPatientCacheKey(sessionId);
        const data = await this.redis.get(key);

        if (!data) {
            return null;
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            this.logger.error(`Error parsing cached patient data for ${sessionId}:`, error);
            return null;
        }
    }

    async hasCachedPatientData(sessionId: string): Promise<boolean> {
        const data = await this.getCachedPatientData(sessionId);
        return data !== null && !!data.cpf && !!data.birthDate;
    }

    async clearPatientCache(sessionId: string): Promise<void> {
        const key = this.getPatientCacheKey(sessionId);
        await this.redis.del(key);
    }

    async cacheAppointments(sessionId: string, appointments: Appointment[]): Promise<void> {
        const key = this.getAppointmentsCacheKey(sessionId);
        await this.redis.setex(key, this.APPOINTMENTS_CACHE_TTL, JSON.stringify(appointments));
    }

    async getCachedAppointments(sessionId: string): Promise<Appointment[] | null> {
        const key = this.getAppointmentsCacheKey(sessionId);
        const data = await this.redis.get(key);

        if (!data) {
            return null;
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            this.logger.error(`Error parsing cached appointments for ${sessionId}:`, error);
            return null;
        }
    }

    async hasCachedAppointments(sessionId: string): Promise<boolean> {
        const appointments = await this.getCachedAppointments(sessionId);
        return appointments !== null && appointments.length > 0;
    }

    async clearAppointmentsCache(sessionId: string): Promise<void> {
        const key = this.getAppointmentsCacheKey(sessionId);
        await this.redis.del(key);
    }

    async clearAllCaches(sessionId: string): Promise<void> {
        await Promise.all([this.clearPatientCache(sessionId), this.clearAppointmentsCache(sessionId)]);
    }

    private getPatientCacheKey(sessionId: string): string {
        return `${this.PATIENT_CACHE_PREFIX}${sessionId}`;
    }

    private getAppointmentsCacheKey(sessionId: string): string {
        return `${this.APPOINTMENTS_CACHE_PREFIX}${sessionId}`;
    }
}
