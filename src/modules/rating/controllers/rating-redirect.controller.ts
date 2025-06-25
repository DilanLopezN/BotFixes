import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as moment from 'moment';
import { RatingService } from '../services/rating.service';

@Controller('a')
export class RatingRedirectControler {
    constructor(private readonly ratingService: RatingService) {}

    @Get(':shortId')
    async updateAccessed(@Res() res: Response, @Param('shortId') shortId: string): Promise<void> {
        const appUrl = process.env.RATING_APP_URI;
        try {
            const rating = await this.ratingService.getOneByShortId(shortId);
            const { setting } = await this.ratingService.getRatingWithSetting(rating.conversationId);

            if (setting.disableLinkAfterRating && rating.ratingSendedAt > 0) {
                return res.redirect(`${appUrl}/success`);
            }

            if (rating.expiresAt > 0 && moment().valueOf() > rating.expiresAt) {
                return res.redirect(`${appUrl}/expired`);
            }

            const token = await this.ratingService.registerAccessToken(shortId, rating);
            return res.redirect(`${appUrl}/?token=${token}`);
        } catch (error) {
            console.log(error);
            return res.redirect(`${appUrl}/error`);
        }
    }
}
