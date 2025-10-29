import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntentLibraryController } from './controllers/intent-library.controller';
import { IntentLibraryService } from './services/intent-library.service';
import { IntentLibrary } from './entities/intent-library.entity';
import { CONTEXT_AI } from '../ormconfig';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';

@Module({
    imports: [TypeOrmModule.forFeature([IntentLibrary], CONTEXT_AI)],
    controllers: [IntentLibraryController],
    providers: [IntentLibraryService],
    exports: [IntentLibraryService],
})
export class IntentLibraryModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(IntentLibraryController);
    }
}
