import { PlusOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';

export const NewTabLabel = () => {
  const { t } = useTranslation();
  const { newTab: remiKeys } = localeKeys.settings.remi.components;

  return (
    <Space size={4}>
      <PlusOutlined />
      {t(remiKeys.label)}
    </Space>
  );
};
