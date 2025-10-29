import { AuthMiddleware } from './../auth/middleware/auth.middleware';
import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { ChannelConfigService } from './channel-config.service';
import { ChannelConfigController } from './channel-config.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelConfigSchema } from './schemas/channel-config.schema';
import { BotsModule } from '../../modules/bots/bots.module';
import { WorkspacesModule } from './../../modules/workspaces/workspaces.module';
import { EventsModule } from './../events/events.module';
import { StorageModule } from '../storage/storage.module';
import { Amqpv2Module } from '../_core/amqpv2/amqpv2.module';
import { CacheModule } from '../_core/cache/cache.module';
import { ChannelConfigPrivateController } from './channel-config-private.controller';
import { ExternalDataService } from './external-data.service';

@Module({
    controllers: [ChannelConfigController, ChannelConfigPrivateController],
    imports: [
        MongooseModule.forFeature([{ name: 'ChannelConfig', schema: ChannelConfigSchema }]),
        forwardRef(() => BotsModule),
        WorkspacesModule,
        StorageModule,
        EventsModule,
        Amqpv2Module,
        CacheModule,
    ],
    providers: [ChannelConfigService, ExternalDataService],
    exports: [ChannelConfigService],
})
export class ChannelConfigModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ChannelConfigController);
    }
}
