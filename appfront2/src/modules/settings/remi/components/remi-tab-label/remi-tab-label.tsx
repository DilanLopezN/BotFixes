import { MoreOutlined } from '@ant-design/icons';
import { Dropdown, Space, Tooltip } from 'antd';
import { RemiTabLabelProps } from './interfaces';

export const RemiTabLabel = ({ name, dropdownItems }: RemiTabLabelProps) => (
  <Space size={4}>
    <Tooltip title={name}>{name}</Tooltip>
    <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
      <MoreOutlined style={{ cursor: 'pointer' }} />
    </Dropdown>
  </Space>
);
