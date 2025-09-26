import { FC } from 'react'
import { Wrapper } from '../../../../../../ui-kissbot-v2/common'
import { GroupAccessItemProps } from './props';
import styled from 'styled-components';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

const Item = styled(Wrapper)`
    height: 45px;
    width: 1100px;
    min-width: 320px;
    transition: background-color .2s;
    cursor: pointer;

    &:hover {
    background-color: #F2F4F8;
  }
`;

const GroupAccessItem: FC<GroupAccessItemProps & I18nProps> = (props) => {
    const {
        groupAccess,
        onEditGroup,
        index
    } = props;

    return (
        <>
            <Wrapper
                borderBottom='1px #CED4DA solid'
                borderRadius={`${index === 1 ? '0 0 5px 5px' : '0'}`}
                width='100%'>
                <Item
                    id={groupAccess._id}
                    bgcolor={'#fff'}
                    width='auto !important'
                    padding='13px 15px'
                    onClick={() => onEditGroup(groupAccess._id)}
                >
                    <Wrapper
                        flexBox>
                        <Wrapper
                            width='35%'
                            fontSize='15px'
                            color='#444'
                            truncate
                            fontWeight='600'>
                            {groupAccess.name}
                        </Wrapper>
                        <Wrapper
                            width='200px'
                            fontSize='15px'
                            color='#444'
                            overflowX='hidden'
                            style={{textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
                            >
                            {groupAccess.accessSettings.ipListData.map((ip, index) => {
                                return `${ip}${index === groupAccess.accessSettings.ipListData.length - 1 ? '' : ' / '} `
                            })}
                        </Wrapper>
                    </Wrapper>
                </Item>
            </Wrapper>
        </>
    )
}

export default i18n(GroupAccessItem) as FC<GroupAccessItemProps>;
