import { Tag } from "../../props";

export interface TagItemProps {
  tag: Tag;
  onSelect: Function;
  selected: boolean;
}