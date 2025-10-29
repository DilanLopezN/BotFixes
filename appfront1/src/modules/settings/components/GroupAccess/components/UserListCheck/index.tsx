import { Checkbox } from 'antd';
import { FC } from 'react'
import { UserAvatar, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { UserListCheckProps } from './props';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../i18n/components/i18n';
import { ColUser, Row } from './styled';

const UserListCheck: FC<UserListCheckProps & I18nProps> = ({
    user,
    handleChecked,
    selected,
    getTranslation,
}) => {

    return (
        <Row style={{borderBottom: '1px solid #eee'}}>
            <ColUser>
                <Checkbox
                    checked={selected}
                    onChange={(ev) => handleChecked(ev.target.checked, user._id as string)}
                    style={{
                        margin: '0 15px 0'
                    }} />
                <Wrapper
                    alignItems='center'
                    flexBox>
                    <UserAvatar
                        user={{ id: user._id, ...user }}
                        margin='0 8px 0 0'
                        size={30}
                    />
                    <span>
                        {user.name}
                    </span>
                </Wrapper>
            </ColUser>
        </Row>
    )
}

export default i18n(UserListCheck) as FC<UserListCheckProps>
