import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { SuggestionTextsService } from './services/suggestion-texts.service';
import { SuggestionTextsController } from './suggestion-texts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { synchronizePostgres } from '../../common/utils/sync';
import { SUGGESTION_TEXTS_CONNECTION } from './ormconfig';
import { SuggestionTexts } from './models/suggestion-texts.entity';
import { ExternalDataService } from './services/external-data.service';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: SUGGESTION_TEXTS_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'context_ai',
        }),
        TypeOrmModule.forFeature([SuggestionTexts], SUGGESTION_TEXTS_CONNECTION),
    ],
    controllers: [SuggestionTextsController],
    providers: [SuggestionTextsService, ExternalDataService],
    exports: [SuggestionTextsService],
})
export class SuggestionTextsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(SuggestionTextsController);
    }
}
