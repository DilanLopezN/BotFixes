import { I18nProps } from './../../../../../i18n/interface/i18n.interface';

export interface TagsProps extends I18nProps {
  conversation: any;
  workspaceId: string;
  onClose: Function;
  onTagsChanged: Function;
  workspaceTags: any[];
  newListTags: Function;
}