import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONTEXT_AI } from '../ormconfig';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { AudioTranscriptionController } from './controllers/audio-transcription.controller';
import { AudioTranscription } from './models/audio-transcription.entity';
import { AudioTranscriptionService } from './services/audio-transcription.service';
import { CacheModule } from '../../_core/cache/cache.module';

@Module({
    imports: [TypeOrmModule.forFeature([AudioTranscription], CONTEXT_AI), CacheModule],
    controllers: [AudioTranscriptionController],
    providers: [AudioTranscriptionService],
    exports: [AudioTranscriptionService],
})
export class AudioTranscriptionModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(AudioTranscriptionController);
    }
}
