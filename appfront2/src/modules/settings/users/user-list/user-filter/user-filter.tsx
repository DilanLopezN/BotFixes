import { ChangeEvent } from 'react';
import { Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { UserFilterType } from '~/constants/user-filter-type';
import { localeKeys } from '~/i18n';
import { UserFilterProps } from './interfaces';
import { InputSearch, Select } from './styles';

const { Option } = Select;

export const UserFilter = (props: UserFilterProps) => {
  const { searchInputValue, selectedFilter, setSelectedFilter, setSearchInputValue } = props;

  const { t } = useTranslation();
  const { userFilter } = localeKeys.settings.users.userList;

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };

  const handleFilterChange = (value: unknown) => {
    setSelectedFilter(value as UserFilterType);
  };

  return (
    <Space>
      <Select<UserFilterType> value={selectedFilter} onChange={handleFilterChange}>
        <Option value={UserFilterType.All}>{t(userFilter.allUsers)}</Option>
        <Option value={UserFilterType.Active}>{t(userFilter.active)}</Option>
        <Option value={UserFilterType.Inactive}>{t(userFilter.inactive)}</Option>
      </Select>
      <InputSearch
        value={searchInputValue}
        allowClear
        placeholder={t(userFilter.searchUsers)}
        onChange={handleSearchChange}
      />
    </Space>
  );
};
