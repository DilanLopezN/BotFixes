import { ChannelConfig } from "../../../../model/Bot";
import { Team } from "../../../../model/Team";

export interface RatingSettings {
    ratingText: string;
    feedbackText: string;
    linkText: string;
    disableLinkAfterRating: boolean;
    expiresIn: number | null;
    teamCriteria?: Team[];
    channelCriteria?: ChannelConfig[];
    id?: number;
    messageAfterRating?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
}