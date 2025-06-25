import { Module, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BotAttributesController } from './botAttributes.controller';
import { BotAttributesService } from './botAttributes.service';
import { BotAttributesSchema } from './schemas/botAttribute.schema';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { EntitiesModule } from '../entities/entities.module';
import { EventsModule } from '../events/events.module';

@Module({
  controllers: [BotAttributesController],
  imports: [
    MongooseModule.forFeature([
      { name: 'BotAttributes', schema: BotAttributesSchema },
    ]),
    EntitiesModule,
    EventsModule,
  ],
  providers: [BotAttributesService],
  exports: [BotAttributesService],
})

export class BotAttributesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(BotAttributesController);
  }
}
