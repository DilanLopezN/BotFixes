import { Switch } from 'antd';
import type { SwitchChangeEventHandler } from 'antd/es/switch';
import { useEffect, useState } from 'react';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { useEnableCategorization } from '../../hooks/use-enable-categorization';

interface EnableConversationCategorizationProps {
  onActive: (isActive: boolean) => void;
}

export const EnableCategorizationSwitch = ({ onActive }: EnableConversationCategorizationProps) => {
  const { userFeatureFlag } = useSelectedWorkspace();
  const { isActivatingCategorization, activateCategorization } = useEnableCategorization();
  const [checked, setChecked] = useState(userFeatureFlag?.enableConversationCategorization);

  const handleCheck: SwitchChangeEventHandler = async (value) => {
    const result = await activateCategorization(value);

    if (result) {
      setChecked(value);
    }
  };

  useEffect(() => {
    if (onActive) {
      onActive(!!checked);
    }
  }, [checked, onActive]);
  return <Switch value={checked} onChange={handleCheck} loading={isActivatingCategorization} />;
};
