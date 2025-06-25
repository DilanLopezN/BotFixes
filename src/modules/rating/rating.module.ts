import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../../config/config.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { ConversationModule } from '../conversation/conversation.module';
import { EventsModule } from '../events/events.module';
import { TeamModule } from '../team/team.module';
import { WorkspaceUserModule } from '../workspace-user/workspace-user.module';
import { RatingExternalControler } from './controllers/rating-external.controller';
import { RatingRedirectControler } from './controllers/rating-redirect.controller';
import { RatingController } from './controllers/rating.controller';
import { TokenRatingValidatorMiddleware } from './middleware/token-rating-validator.middleware';
import { RatingSetting } from './models/rating-setting.entity';
import { Rating } from './models/rating.entity';
import { RATING_CONNECTION, RATING_READ_CONNECTION } from './ormconfig';
import { DialogRatingService } from './services/dialog-rating.service';
import { RatingChannelConsumerService } from './services/rating-channel-consumer.service';
import { RatingSettingService } from './services/rating-setting.service';
import { RatingService } from './services/rating.service';
import { ExternalDataService } from './services/external-data.service';
import { synchronizePostgres } from '../../common/utils/sync';
import { RatingHealthCheckService } from './services/rating-health-check.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: RATING_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'rating',
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: RATING_READ_CONNECTION,
            url: process.env.POSTGRESQL_READ_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}', Rating],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'rating',
        }),
        TypeOrmModule.forFeature([Rating, RatingSetting], RATING_CONNECTION),
        TypeOrmModule.forFeature([Rating], RATING_READ_CONNECTION),
        EventsModule,
        TeamModule,
        WorkspaceUserModule,
        ConversationModule,
    ],
    providers: [
        RatingService,
        RatingSettingService,
        RatingChannelConsumerService,
        DialogRatingService,
        ExternalDataService,
        RatingHealthCheckService,
    ],
    controllers: [RatingExternalControler, RatingController, RatingRedirectControler],
})
export class RatingModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(TokenRatingValidatorMiddleware).forRoutes(RatingExternalControler);
        consumer.apply(AuthMiddleware).forRoutes(RatingController);
    }
}
