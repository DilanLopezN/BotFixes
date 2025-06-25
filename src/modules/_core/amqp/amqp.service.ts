import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
@Injectable()
export class AmqpService {

    private readonly logger = new Logger(AmqpService.name);
    private amqpServerUri: string;
    private connection: amqp.AmqpConnectionManager;
    constructor() {
        this.amqpServerUri = process.env.AMQP_SERVER_URI;
        this.createConnection();
    }

    public getEventExchangeName(): string {
        return process.env.EVENT_EXCHANGE_NAME;
    }


    public getChannelExchangeName(): string {
        return process.env.CHANNEL_EXCHANGE_NAME;
    }

    /**
     * Cria uma nova conexão com o AmqpServer.
     * Essa connection deve tentar reconectar quando servidor cair.
     */
    private async createConnection(times = 0): Promise<any> {
        this.connection = amqp.connect([this.amqpServerUri], {heartbeatIntervalInSeconds: '0' as any});
        this.connection.on('connect', (e) => {
            this.logger.log(`AmqpService connection established`)
        });
        this.connection.on('unblocked', (e) => {
            this.logger.log(`AmqpService connection unblocked`)
        });
        this.connection.on('blocked', (e) => {
            this.logger.error(`AmqpService connection blocked`);
        });
        this.connection.on('connectFailed', (e) => {
            this.logger.error(`AmqpService connection connectFailed`);
        });
        this.connection.on('disconnect', (e) => {
            this.logger.error(`AmqpService connection disconnected`);
        });
    }

    public getConnection() {
        return this.connection;
    }

    async status() {
        return this.connection.isConnected();
    }

}
