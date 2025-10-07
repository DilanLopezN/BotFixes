import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { FlowSaveButtonProps } from './interfaces';

export const FlowSaveButton = ({ selectedFlow, isSaveEnabled, isLoading }: FlowSaveButtonProps) => {
  const { t } = useTranslation();
  const whatsAppFlowLocaleKeys = localeKeys.settings.whatsAppFlow.components;

  const isCreating = !selectedFlow;
  const label = isCreating
    ? t(whatsAppFlowLocaleKeys.editor.createFlowInChannel)
    : t(whatsAppFlowLocaleKeys.editor.updateFlow);

  return (
    <Tooltip title={!isSaveEnabled ? t(whatsAppFlowLocaleKeys.editor.noPendingChangesTooltip) : ''}>
      <Button
        type='primary'
        form='whats-flow-form'
        htmlType='submit'
        loading={isLoading}
        disabled={!isSaveEnabled}
      >
        {label}
      </Button>
    </Tooltip>
  );
};
