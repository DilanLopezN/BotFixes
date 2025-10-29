import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioTts } from './entities/audio.entity';
import { AudioTtsService } from './services/audio-tts.service';
import { OpenAITTSProvider } from './services/providers/openai-tts-provider.service';
import { GoogleTTSProvider } from './services/providers/google-tts-provider.service';
import { TTSProviderFactory } from './services/providers/tts-provider-factory.service';
import { ExternalDataService } from './services/external-data.service';
import { CONTEXT_AI } from '../ormconfig';

@Module({
    imports: [TypeOrmModule.forFeature([AudioTts], CONTEXT_AI)],
    controllers: [],
    providers: [AudioTtsService, OpenAITTSProvider, GoogleTTSProvider, TTSProviderFactory, ExternalDataService],
    exports: [AudioTtsService, TTSProviderFactory, ExternalDataService],
})
export class AudioTtsModule {}
