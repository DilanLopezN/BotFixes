export class CreateRatingSettingDto {
    feedbackText: string;
    linkText: string;
    ratingText: string;
    expiresIn: number;
    disableLinkAfterRating: boolean;
    teamCriteria?: string[];
    tagCriteria?: string[];
    channelCriteria?: string[];
    messageAfterRating?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
}
