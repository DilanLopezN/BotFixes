import { AuthMiddleware } from './../auth/middleware/auth.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationSettingsSchema } from './schema/organization-settings.schema';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { OrganizationSettingsService } from './organization-settings.service';
import { OrganizationSettingsController } from './organization-settings.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'OrganizationSettings', schema: OrganizationSettingsSchema },
    ]),
    EventsModule,
  ],
  providers: [OrganizationSettingsService],
  exports: [OrganizationSettingsService],
  controllers: [OrganizationSettingsController],
})
export class OrganizationSettingsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(OrganizationSettingsController);
  }
}
