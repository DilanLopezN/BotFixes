import { Tag } from "../../../../../liveAgent/components/TagSelector/props";

export interface TagItemProps {
    tag: Tag;
    onEditTag: Function;
    index: number;
}