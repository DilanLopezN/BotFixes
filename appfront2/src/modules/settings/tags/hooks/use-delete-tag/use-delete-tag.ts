import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { deleteTagWorkspace } from '~/services/workspace/delete-tag';
import { notifyError } from '~/utils/notify-error';

export const useDeleteTag = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [tagDeletingError, setTagDeletingError] = useState<ApiError>();

  const deleteTagLocaleKeys = localeKeys.settings.tags.hooks.deleteTag;

  const deleteTag = useCallback(
    async (tagId: string) => {
      if (!tagId) {
        notifyError(t(deleteTagLocaleKeys.deleteIdNotFound));
        return false;
      }

      try {
        setIsDeleting(true);
        setTagDeletingError(undefined);
        await deleteTagWorkspace(workspaceId, tagId);
        setIsDeleting(false);
        return true;
      } catch (err) {
        setTagDeletingError(err as ApiError);
        setIsDeleting(false);
        notifyError(t(deleteTagLocaleKeys.deleteTagError));
        return false;
      }
    },
    [t, deleteTagLocaleKeys, workspaceId]
  );

  return { isDeleting, tagDeletingError, deleteTag };
};
