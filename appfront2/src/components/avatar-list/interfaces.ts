export interface AvatarListProps {
  data: {
    _id: React.Key;
    name: string;
    avatar?: string;
  }[];
  hiddenCount?: number;
}
