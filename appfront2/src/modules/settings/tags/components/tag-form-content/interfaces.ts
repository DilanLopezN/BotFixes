import { FormInstance } from 'antd';
import { TagFormValues } from '../tag-form-modal/interfaces';

export interface TagFormContentProps {
  form: FormInstance<TagFormValues>;
  selectedColor: string;
  setSelectedColor: (hex: string) => void;
  isSystemAdmin: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isFetchingTags: boolean;
  onFinish: (values: TagFormValues) => void;
}
