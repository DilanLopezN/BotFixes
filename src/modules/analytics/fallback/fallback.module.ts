import { MiddlewareConsumer, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ANALYTICS_CONNECTION } from "../ormconfig";
import { Fallback } from "kissbot-entities";
import { FallbackService } from "./services/fallback.service";
import { FallbackController } from "./fallback.controller";
import { EventsModule } from "./../../events/events.module";
import { AuthMiddleware } from "./../../auth/middleware/auth.middleware";

@Module({
    controllers: [
        FallbackController,
    ],
    imports: [
        EventsModule,
        TypeOrmModule.forFeature([Fallback], ANALYTICS_CONNECTION)
    ],
    providers: [
        FallbackService,
    ]
})
export class FallbackModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(FallbackController);
    }
}