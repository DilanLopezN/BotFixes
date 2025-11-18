import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class StatusService {
  constructor(@InjectConnection() private connection: Connection) {}

  async getStatusObject() {
    const db = await this.wrapper(this.mongo, 'mongo');
    return {
      db,
    };
  }

  async status() {
    await this.getStatusObject();
  }

  mongo = async (): Promise<string | boolean> => {
    try {
      const result = await this.connection.db.command({
        ping: 1,
      });
      return result?.ok == 1;
    } catch (e) {
      Sentry.captureException(e);
      return false;
    }
  };

  private async wrapper(check: () => Promise<string | boolean>, checker: string) {
    return new Promise((res) => {
      const timer = setTimeout(() => {
        Sentry.captureEvent({
          message: 'timeoutApiCheckerIntegration',
          extra: {
            timeoutApiChecker: checker,
          },
        });
      }, 1500);
      check().then((success) => {
        clearTimeout(timer);
        res({ running: success });
      });
    });
  }
}
