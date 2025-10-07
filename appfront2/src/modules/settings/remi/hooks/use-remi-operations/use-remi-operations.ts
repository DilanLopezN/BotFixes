import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { convertConfigDataToFormData } from '../../utils/convert-config-data-to-form-data';
import { convertFormDataToCreateData } from '../../utils/convert-form-data-to-create-data';
import { useCreateRemiSetting } from '../use-create-remi-settings';
import { useDeleteAutomaticReschedule } from '../use-delete-automatic-reschedule';
import { useUpdateRemiSetting } from '../use-update-remi-setting';

export const useRemiOperations = (allRemiSettings: any[], onRemiCreated: () => void) => {
  const { t } = useTranslation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { useRemiOperations: remiKeys } = localeKeys.settings.remi.hooks;
  const { children: remiModules } = routes.modules.children.settings.children.remi;

  const [isCloning, setIsCloning] = useState(false);
  const [isCopyingConfig, setIsCopyingConfig] = useState(false);

  const { createRemiSetting } = useCreateRemiSetting();
  const { updateRemiSetting } = useUpdateRemiSetting();
  const { deleteAutomaticReschedule, isDeleting } = useDeleteAutomaticReschedule();

  const handleCloneRemi = useCallback(
    async (remiIdToClone: string) => {
      if (isCloning || isCopyingConfig || isDeleting) return;

      const sourceRemi = allRemiSettings.find((remi) => remi.id === remiIdToClone);
      if (!sourceRemi) {
        notifyError({ message: t(remiKeys.cloneError) });
        return;
      }

      setIsCloning(true);
      try {
        const formData = convertConfigDataToFormData(sourceRemi);
        const createData = convertFormDataToCreateData(formData);
        createData.name = `${t(remiKeys.clonePrefix)} ${
          sourceRemi.name || t(remiKeys.defaultName)
        }`;

        const newRemi = await createRemiSetting(createData);
        if (newRemi?.id) {
          notifySuccess({ message: t(remiKeys.cloneSuccess), description: '' });
          onRemiCreated();
          const newPath = generatePath(remiModules.remiUpdate.fullPath, {
            workspaceId,
            remiId: newRemi.id,
          });
          navigate(newPath);
        } else {
          notifyError({ message: t(remiKeys.cloneError) });
        }
      } catch (error) {
        notifyError({ message: t(remiKeys.cloneError) });
      } finally {
        setIsCloning(false);
      }
    },
    [
      allRemiSettings,
      createRemiSetting,
      isCloning,
      isCopyingConfig,
      isDeleting,
      navigate,
      onRemiCreated,
      remiKeys.cloneError,
      remiKeys.clonePrefix,
      remiKeys.cloneSuccess,
      remiKeys.defaultName,
      remiModules.remiUpdate.fullPath,
      t,
      workspaceId,
    ]
  );

  const handleCopyConfig = useCallback(
    async (sourceRemiId: string, targetRemiId: string) => {
      if (!sourceRemiId || !targetRemiId || isCloning || isCopyingConfig || isDeleting)
        return false;

      const sourceRemi = allRemiSettings.find((remi) => remi.id === sourceRemiId);
      const targetRemi = allRemiSettings.find((remi) => remi.id === targetRemiId);

      if (!sourceRemi || !targetRemi) {
        notifyError({ message: t(remiKeys.copyConfigSourceTargetError) });
        return false;
      }

      setIsCopyingConfig(true);
      try {
        const formData = convertConfigDataToFormData(sourceRemi);
        const updateData = convertFormDataToCreateData(formData);
        updateData.name = targetRemi.name || '';

        const result = await updateRemiSetting(updateData, targetRemi.id);
        setIsCopyingConfig(false);
        if (result) {
          notifySuccess({ message: t(remiKeys.copyConfigSuccess), description: '' });
          onRemiCreated();
          const targetPath = generatePath(remiModules.remiUpdate.fullPath, {
            workspaceId,
            remiId: result.id,
          });
          navigate(targetPath);
          return true;
        }
        notifyError({ message: t(remiKeys.copyConfigError) });
        return false;
      } catch (error) {
        notifyError({ message: t(remiKeys.copyConfigError) });
        return false;
      }
    },
    [
      allRemiSettings,
      isCloning,
      isCopyingConfig,
      isDeleting,
      navigate,
      onRemiCreated,
      remiKeys.copyConfigError,
      remiKeys.copyConfigSourceTargetError,
      remiKeys.copyConfigSuccess,
      remiModules.remiUpdate.fullPath,
      t,
      updateRemiSetting,
      workspaceId,
    ]
  );

  const handleDeleteRemi = useCallback(
    async (remiIdToDelete: string, currentRemiId?: string) => {
      const success = await deleteAutomaticReschedule(remiIdToDelete);
      if (success) {
        notifySuccess({ message: t('Deletado com Sucesso'), description: '' });
        onRemiCreated();

        if (currentRemiId === remiIdToDelete) {
          const remainingRemis = allRemiSettings.filter((remi) => remi.id !== remiIdToDelete);
          const targetId = remainingRemis.length > 0 ? remainingRemis[0].id : 'new';
          const newPath = generatePath(remiModules.remiConfig.fullPath, {
            workspaceId,
            remiId: targetId,
          });
          navigate(newPath);
        }
        return true;
      }
      return false;
    },
    [
      deleteAutomaticReschedule,
      t,
      onRemiCreated,
      allRemiSettings,
      remiModules.remiConfig.fullPath,
      workspaceId,
      navigate,
    ]
  );

  return {
    isCloning,
    isCopyingConfig,
    isDeleting,
    handleCloneRemi,
    handleCopyConfig,
    handleDeleteRemi,
    isOperationInProgress: isCloning || isCopyingConfig || isDeleting,
  };
};
