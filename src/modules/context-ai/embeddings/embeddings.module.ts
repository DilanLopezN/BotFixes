import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { DatabaseService } from '../helpers/database.service';
import { TrainingEntryModule } from '../training-entry/training-entry.module';

@Module({
    imports: [TrainingEntryModule],
    providers: [EmbeddingsService, DatabaseService],
    exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
