import { Tag } from "../../../../../liveAgent/components/TagSelector/props";

export interface HangTagsListProps {
    loading: boolean;
    loadingMore: boolean;
    workspaceTags: Tag[] | undefined;
    onEditTag: Function;
}