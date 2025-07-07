import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from 'kissbot-entities';
import * as Sentry from '@sentry/node';
import { ANALYTICS_CONNECTION } from '../../consts';
@Injectable()
export class ActivityService {
    private workspacesToSaveAck = [
        '60462eee1e8fbe0007be66f6',
        '60462f051e8fbe0007be6718',
        '61fec45a09b57e000779711d',
        '619668532add63000762544d',
        '61a543609ead750008ac4002',
        '61fd78b909b57e00074d541d',
        '6026801a3505ea24d5ee80cc', //local guilherme
    ]
    constructor(
        @InjectRepository(Activity, ANALYTICS_CONNECTION)
        private activityAnalyticsRepository: Repository<Activity>,
    ) {}

    async createBulk(activities: Activity[]) {
        try {
            activities.map(async (activity) => {
                try {
                    await this.activityAnalyticsRepository.save(activity);
                } catch (e) {
                    if (!((e.message || '') as string).includes('duplicate key value violates unique')) {
                        console.log(`${ActivityService.name}.createBulk 1`, e);
                        Sentry.captureEvent({
                            message: `${ActivityService.name}.createBulk 1`, extra: {
                                error: e,
                                activities,
                            }
                        });
                    } else {
                        console.log('Duplicou ActivityService.createBulk');
                        // throw e;
                    }
                }
            });
        } catch (e) {
            if (!((e.message || '') as string).includes('duplicate key value violates unique')) {
                console.log(`${ActivityService.name}.createBulk 2`, e);
                Sentry.captureEvent({
                    message: `${ActivityService.name}.createBulk 2`, extra: {
                        error: e,
                        activities,
                    }
                });
            } else {
                console.log('Duplicou ActivityService.createBulk');
            }
        }
    }

    // IActivityAckAndHashUpdatedEvent

    async updateActivityAck(hash: string, ack: number, workspaceId?: string) {
        
        try {
            if (!workspaceId || !this.workspacesToSaveAck.includes(workspaceId)) return;
            let query = this.activityAnalyticsRepository.createQueryBuilder().update();

            query = query.where('hash = :hash', { hash });

            if (ack >= 0) {
                query = query.andWhere('ack <= :ack', { ack });
            }

            return await query.set({ ack }).execute();
        } catch (e) {
            console.log(`${ActivityService.name}.updateActivityAck`, e);
            Sentry.captureEvent({
                message: `${ActivityService.name}.updateActivityAck`, extra: {
                    error: e,
                    hash,
                    ack,
                    workspaceId,
                }
            });
            // throw e;
        }
    }

    async create(activity: Activity) {
        try {
            await this.activityAnalyticsRepository.save(activity);
        } catch (e) {
            if (((e.message || '') as string).indexOf('duplicate key value violates unique constraint') > -1) {
                console.log('ActivityService.create ignore', e);
            } else {
                console.log(`${ActivityService.name}.create`, e);
                Sentry.captureEvent({
                    message: `${ActivityService.name}.create`, extra: {
                        activity,
                        error: e,
                    },
                });
                // throw e;
            }
        }
    }
}
