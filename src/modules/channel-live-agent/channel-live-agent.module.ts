import { TeamModule } from './../team/team.module';
import { Module, forwardRef } from '@nestjs/common';
import { ChannelLiveAgentService } from './services/channel-live-agent.service';
import { UsersModule } from './../users/users.module';
import { ChannelConfigModule } from './../../modules/channel-config/channel-config.module';
import { EventsChannelLiveAgentService } from './services/events-channel-live-agent.service';
import { EventsModule } from './../../modules/events/events.module';

@Module({
    imports: [
        UsersModule,
        ChannelConfigModule,
        UsersModule,
        forwardRef(() => EventsModule),
        EventsModule,
        TeamModule,
    ],
    providers: [
        ChannelLiveAgentService,
        EventsChannelLiveAgentService,
    ],
    exports: [
        ChannelLiveAgentService,
    ],
})

export class ChannelLiveAgentModule { }
