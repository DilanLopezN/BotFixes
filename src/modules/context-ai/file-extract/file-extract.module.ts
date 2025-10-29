import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileExtract } from './entities/file-extract.entity';
import { FileExtractService } from './services/file-extract.service';
import { FileExtractController } from './controllers/file-extract.controller';
import { CONTEXT_AI } from '../ormconfig';
import { AiProviderModule } from '../ai-provider/ai.module';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { FileExtractorRegistry, CarteirinhaBeneficiarioFileExtractor } from './extractors';

@Module({
    imports: [TypeOrmModule.forFeature([FileExtract], CONTEXT_AI), AiProviderModule],
    controllers: [FileExtractController],
    providers: [FileExtractService, FileExtractorRegistry, CarteirinhaBeneficiarioFileExtractor],
    exports: [FileExtractService],
})
export class FileExtractModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(FileExtractController);
    }
}
