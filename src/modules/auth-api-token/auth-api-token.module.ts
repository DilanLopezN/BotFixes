import { AuthApiTokenService } from './auth-api-token.service';
import { AuthMiddleware } from './../auth/middleware/auth.middleware';
import { AuthModule } from './../auth/auth.module';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuthApiTokenController } from './auth-api-token.controller';
import { EventsModule } from '../events/events.module';

@Module({
  controllers: [AuthApiTokenController],
  imports: [
    AuthModule,
    EventsModule,
  ],
  providers: [AuthApiTokenService],
})

export class AuthApiTokenModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(AuthApiTokenController);
  }
}
