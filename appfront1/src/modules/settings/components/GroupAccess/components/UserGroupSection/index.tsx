import { FC, useState } from 'react'
import { Card, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { UserGroupSectionProps } from './props'
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import styled from 'styled-components';
import UserListCheck from '../UserListCheck';


const Scroll = styled(Wrapper)`
    &::-webkit-scrollbar {
    width: 3px;
    }
    
    &::-webkit-scrollbar-track {
    background : #E8E8E8;
    border-radius: 10px;
    }
    
    &::-webkit-scrollbar-thumb {
    background : #999999;
    border-radius: 10px;
    }
`;

const UserGroupSection: FC<UserGroupSectionProps & I18nProps> = ({
    group,
    userList,
    getTranslation,
    formik,
}) => {
    const [usersChecked, setUsersChecked] = useState<string[]>(group.accessSettings.userList)

    const handleChecked = (boolean, value: string) => {

        if (!boolean) {
            const index = usersChecked.indexOf(value)
            let list = usersChecked
            list.splice(index, 1)
            setUsersChecked(list)
            return list
        }
        let list = usersChecked
        list.push(value)
        setUsersChecked(list)
        return list
    }

    return (
            <Scroll
                padding='0 10px'
                height={'100%'}
                overflowY='auto'>
                <Card header={getTranslation('Users')}>
                    <Wrapper
                        bgcolor='#fff'
                        margin='-8px -10px -9px -10px'
                        borderRadius='5px'
                    >
                        {userList.map(user => {
                            return <UserListCheck
                                key={user._id}
                                handleChecked={(boolean, value) => {
                                    formik.setFieldValue('accessSettings.userList', handleChecked(boolean, value))
                                }
                                }
                                selected={usersChecked.find(id => id === user._id) ? true : false}
                                user={user}
                            />
                        })}
                    </Wrapper>
                </Card>
            </Scroll>
    )
}

export default i18n(UserGroupSection) as FC<UserGroupSectionProps>
