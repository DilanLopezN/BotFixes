import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { ExternalRatingConversationIdDecorator } from '../decorators/external-rating-conversationid.decorator';
import { UpdateRatingDto, UpdateRatingValueDto } from '../dto/rating.dto';
import { ExternalValidatorGuard } from '../guards/external-validator.guard';
import { RatingService } from '../services/rating.service';

@Controller('rating-external')
export class RatingExternalControler {
    constructor(private readonly ratingService: RatingService) {}
    @Put('rating-value')
    @UseGuards(ExternalValidatorGuard)
    async updateRatingValue(
        @Body() body: UpdateRatingValueDto,
        @ExternalRatingConversationIdDecorator() conversationId: string,
    ): Promise<void> {
        return await this.ratingService.updateRatingValue(body.value, conversationId);
    }

    @Put()
    @UseGuards(ExternalValidatorGuard)
    async updateRating(
        @Body() body: UpdateRatingDto,
        @ExternalRatingConversationIdDecorator() conversationId: string,
    ): Promise<void> {
        return await this.ratingService.updateRating(body.feedbackMessage, body.value, conversationId);
    }

    @Put('rating-accessed')
    @UseGuards(ExternalValidatorGuard)
    async updateAccessed(@ExternalRatingConversationIdDecorator() conversationId: string): Promise<void> {
        return await this.ratingService.updateRatingAccessed(conversationId);
    }

    @Put('rating-exit')
    @UseGuards(ExternalValidatorGuard)
    async updateExit(@ExternalRatingConversationIdDecorator() conversationId: string): Promise<void> {
        return await this.ratingService.updateRatingExit(conversationId);
    }
}
