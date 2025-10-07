import { Switch } from 'antd';
import type { SwitchChangeEventHandler } from 'antd/es/switch';
import { useEffect, useState } from 'react';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { useEnableRemi } from '../../hooks/use-enable-remi';

interface EnableConversationRemiProps {
  onActive: (isActive: boolean) => void;
}

export const EnableRemiSwitch = ({ onActive }: EnableConversationRemiProps) => {
  const { userFeatureFlag } = useSelectedWorkspace();
  const { isActivatingRemi, activateRemi } = useEnableRemi();
  const [checked, setChecked] = useState(userFeatureFlag?.enableRemi);

  const handleCheck: SwitchChangeEventHandler = async (value) => {
    const result = await activateRemi(value);

    if (result) {
      setChecked(value);
    }
  };

  useEffect(() => {
    if (onActive) {
      onActive(!!checked);
    }
  }, [checked, onActive]);

  useEffect(() => {
    setChecked(Boolean(userFeatureFlag?.enableRemi));
  }, [userFeatureFlag?.enableRemi]);

  return <Switch value={checked} onChange={handleCheck} loading={isActivatingRemi} />;
};
