import { MiddlewareConsumer, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Fallback } from "kissbot-entities";
import { ANALYTICS_CONNECTION } from "../consts";
import { FallbackConsumerService } from "./services/fallback-consumer.service";
import { FallbackService } from "./services/fallback.service";


@Module({
    controllers: [
    ],
    imports: [
        TypeOrmModule.forFeature([Fallback], ANALYTICS_CONNECTION)
    ],
    providers: [
        FallbackService,
        FallbackConsumerService,
    ]
})
export class FallbackModule {}