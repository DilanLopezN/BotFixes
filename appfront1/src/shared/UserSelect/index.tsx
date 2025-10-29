import { useEffect, FC, useState } from 'react'
import isEmpty from 'lodash/isEmpty';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import I18n from '../../modules/i18n/components/i18n';
import { CustomCreatableSelect } from '../StyledForms/CustomCreatableSelect/CustomCreatableSelect';
import { User } from 'kissbot-core';
import { WorkspaceUserService } from '../../modules/settings/service/WorkspaceUserService';

export interface UserSelectProps {
    currentValue: string;
    userIds: string[];
    onChange: (selectedValue: string) => any;
}
const UserSelect = ({ getTranslation, currentValue, onChange, userIds }: UserSelectProps & I18nProps) => {

    const [users, setUsers] = useState<User[] | undefined>(undefined);
    const [value, setValue] = useState<{ label: string, value: string } | undefined>(undefined);

    useEffect(() => {
        fetchUsers();

    }, [userIds])

    useEffect(() => {
        setCurrentValue();

    }, [currentValue, users])

    const fetchUsers = async () => {
        try {
            let result;
            if (userIds) {
                const reducedIds = userIds.reduce((total, curr, index) => {
                    return `${total}${curr}${index < (userIds.length - 1) ? ',' : ''}`
                }, '')

                if(reducedIds){
                    result = await WorkspaceUserService.queryUsersByIdList(reducedIds);
                    if (result && result.data) {
                        setUsers(result.data);
                    }
                }else {
                    setValue({
                        label: getTranslation('Cannot found any user'),
                        value: '',
                    })
                    setUsers(undefined)
                }

            } else {
                setValue({
                    label: getTranslation('Cannot found any user'),
                    value: '',
                })
                setUsers(undefined)
            }
        } catch (e) {
            setValue({
                label: getTranslation('Error on load users'),
                value: '',
            })
        }
    }

    const renderOptions = () => {
        if (!users) return [];
        return users.map(user => ({
            label: user.name,
            value: user._id
        }));
    }

    const setCurrentValue = () => {
        const currentValueResult = {
            label: '',
            value: '',
        }
        if (!users || !currentValue) {
            return setValue(currentValueResult);
        }

        if (currentValue) {
            const user = users.find(u => u._id == currentValue);
            currentValueResult.label = (user as User).name as string;
            currentValueResult.value = (user as User)._id as string;
        }
        return setValue(currentValueResult);
    }

    return <CustomCreatableSelect
        options={
            [...renderOptions()]
        }
        placeholder={getTranslation('Select a user')}
        value={value}
        onCreateOption={(ev) => {
            onChange(ev);
        }}
        onChange={ev => {
            if (ev === null || isEmpty(ev)) {
                return onChange('');
            }
            return onChange(ev);
        }}
    />
}
export default I18n(UserSelect) as FC<UserSelectProps>;
