import { Injectable } from '@nestjs/common';
import { AnalyticsInterval } from '../interfaces/analytics.interface';

@Injectable()
export class AnalyticsUtilService {
    getInterval(interval: AnalyticsInterval) {
        switch (interval) {
            case AnalyticsInterval['1C']: {
                return 'century';
            }
            case AnalyticsInterval['1M']: {
                return 'month';
            }
            case AnalyticsInterval['1d']: {
                return 'day';
            }
            case AnalyticsInterval['1h']: {
                return 'hour';
            }
            case AnalyticsInterval['1m']: {
                return 'minute';
            }
            case AnalyticsInterval['1w']: {
                return 'week';
            }
            default:
                return 'day';
        }
    }
}
