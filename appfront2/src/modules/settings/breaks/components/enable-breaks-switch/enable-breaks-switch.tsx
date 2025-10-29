import { Alert, Space, Switch } from 'antd';
import type { SwitchChangeEventHandler } from 'antd/es/switch';
import { useEffect, useState } from 'react';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { useEnableBreaks } from '../../hooks/use-enable-breaks';

export const EnableBreaksSwitch = () => {
  const { generalConfigs } = useSelectedWorkspace();
  const { activateBreaks, isActivatingBreaks } = useEnableBreaks();
  const [checked, setChecked] = useState(Boolean(generalConfigs?.enableAgentStatusForAgents));

  const handleCheck: SwitchChangeEventHandler = async (value) => {
    const result = await activateBreaks(value);

    if (result) {
      setChecked(value);
    }
  };

  useEffect(() => {
    setChecked(Boolean(generalConfigs?.enableAgentStatusForAgents));
  }, [generalConfigs?.enableAgentStatusForAgents]);

  return (
    <Space size='large'>
      <Switch value={checked} onChange={handleCheck} loading={isActivatingBreaks} />
      {!checked && (
        <Alert message='A funcionalidade está inativa. Clique no botão ao lado para ativar.' />
      )}
    </Space>
  );
};
