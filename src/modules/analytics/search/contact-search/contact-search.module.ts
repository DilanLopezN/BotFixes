import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../../../../config/config.module';
import { AuthMiddleware } from '../../../../modules/auth/middleware/auth.middleware';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { ContactSearchController } from './contact-search.controller';
import { ContactSearch } from 'kissbot-entities';
import { ContactSearchService } from './services/contact-search.service';

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([ContactSearch], ANALYTICS_READ_CONNECTION)],
    providers: [ContactSearchService],
    controllers: [ContactSearchController],
    exports: [ContactSearchService],
})
export class ContactSearchModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ContactSearchController);
    }
}
