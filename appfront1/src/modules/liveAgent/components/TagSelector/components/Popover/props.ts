export interface PopoverProps {
  opened: boolean;
  conversation: any;
  workspaceId: string;
  onClose: Function;
  onTagsChanged: Function;
  workspaceTags: any[];
  place?: string;
  newListTags: Function;
  children?: React.ReactNode;
}
