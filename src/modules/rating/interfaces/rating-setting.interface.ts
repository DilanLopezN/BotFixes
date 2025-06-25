export interface CreateRatingSettingData {
    workspaceId: string;
    feedbackText: string;
    linkText: string;
    ratingText: string;
    disableLinkAfterRating: boolean;
    expiresIn: number;
    teamCriteria?: string[];
    tagCriteria?: string[];
    channelCriteria?: string[];
    messageAfterRating?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
}
