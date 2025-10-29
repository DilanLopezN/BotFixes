import { FC } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { GroupsAccessListProps } from './props';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import styled from 'styled-components';
import GroupAccessItem from '../GroupAccessItem';
import SkeletonLines from '../../../../../../shared/skeleton-lines';

const EmptyImage = styled('img')`
    height: 125px;
`;

const GroupsAccessList: FC<GroupsAccessListProps & I18nProps> = (props) => {
    const {
        getTranslation,
        loading,
        loadingMore,
        workspaceGroups,
        onEditGroup,
    } = props;
    return (
        <Wrapper>
            {loading ? (
                <SkeletonLines
                    rows={1}
                    style={{
                        borderRadius: '6px',
                        padding: '13px 15px',
                        margin: '0 0 3px 0',
                        height: '50px',
                    }}
                />
            ) : workspaceGroups && workspaceGroups.length > 0 ? (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        background: '#fff',
                        border: '1px solid #CED4DA',
                        borderBottom: 'none',
                        borderRadius: '5px',
                    }}
                >
                    <Wrapper
                        borderRadius='5px 5px 0 0'
                        borderBottom='1px #CED4DA solid'
                        bgcolor='#f2f2f2'
                        width='100%'
                        minWidth='320px'
                        height='45px'
                        color='#555'
                        fontSize='large'
                        padding='10px'
                    >
                        {getTranslation('Groups access')}
                    </Wrapper>
                    {workspaceGroups
                        .sort((a, b) => {
                            return a.name === b.name ? 0 : a.name ? 1 : -1;
                        })
                        .map((group, index) => {
                            return (
                                <GroupAccessItem
                                    key={group._id}
                                    groupAccess={group}
                                    onEditGroup={onEditGroup}
                                    index={workspaceGroups.length - 1 === index ? 1 : 0}
                                />
                            );
                        })}
                    <div id='groupAccess-list-area' />
                    {loadingMore && (
                        <SkeletonLines
                            rows={1}
                            style={{
                                borderRadius: '6px',
                                padding: '13px 15px',
                                margin: '0 0 3px 0',
                                height: '50px',
                            }}
                        />
                    )}
                </div>
            ) : (
                <Wrapper height='150px' flexBox margin='30px 0 0 0' justifyContent='center' alignItems='center'>
                    <Wrapper>
                        <Wrapper flexBox justifyContent='center'>
                            <EmptyImage src='/assets/img/empty_draw.svg' />
                        </Wrapper>
                        <Wrapper fontSize='13px' margin='15px 0 0 0'>
                            {getTranslation('No access groups found')}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrapper>
    );
};

export default i18n(GroupsAccessList) as FC<GroupsAccessListProps>;
