import { Module, Global, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { TeamModule } from '../team/team.module';
import { EventsModule } from '../events/events.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
    ]),
    forwardRef(() => UsersModule),
    TeamModule,
    EventsModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
