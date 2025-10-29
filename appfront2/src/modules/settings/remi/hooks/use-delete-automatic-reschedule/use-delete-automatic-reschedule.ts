import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { deleteAutomaticRescheduleById } from '~/services/workspace/delete-automatic-reschedule-by-id';
import { notifyError } from '~/utils/notify-error';

export const useDeleteAutomaticReschedule = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [automaticRescheduleDeletingError, setAutomaticRescheduleDeletingError] =
    useState<ApiError>();

  const { t } = useTranslation();

  const deleteAutomaticReschedule = useCallback(
    async (automaticRescheduleId: string) => {
      try {
        setIsDeleting(true);
        await deleteAutomaticRescheduleById(workspaceId, automaticRescheduleId);
        setIsDeleting(false);
        return true;
      } catch (err) {
        setAutomaticRescheduleDeletingError(err as ApiError);
        setIsDeleting(false);
        notifyError(t('error'));
        return false;
      }
    },
    [t, workspaceId]
  );

  return { isDeleting, automaticRescheduleDeletingError, deleteAutomaticReschedule };
};
