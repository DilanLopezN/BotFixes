export interface TagFormValues {
  name: string;
  active: boolean;
}

export interface TagFormModalProps {
  workspaceId: string;
  tagId: string;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}
