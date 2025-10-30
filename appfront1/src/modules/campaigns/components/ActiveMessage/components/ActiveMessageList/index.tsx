import { FC } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import SkeletonLines from '../../../../../../shared/skeleton-lines';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { isSystemAdmin, isSystemDevAdmin } from '../../../../../../utils/UserPermission';
import ActiveMessageItem from '../ActiveMessageItem';
import { ActiveMessageListProps } from './props';

const EmptyImage = styled('img')`
    height: 125px;
`;

const ActiveMessageList: FC<ActiveMessageListProps & I18nProps> = (props) => {
    const {
        workspaceId,
        addNotification,
        getTranslation,
        loading,
        workspaceActiveMessage,
        workspaceChannels,
        onDeletedActiveMessage,
        onEditActiveMessage,
    } = props;

    const loggedUser = useSelector((state: any) => state.loginReducer.loggedUser);

    const userCanDelete = isSystemAdmin(loggedUser) || isSystemDevAdmin(loggedUser);

    const transformModelList = () => {
        const modelList = workspaceActiveMessage.map((actMessage) => {
            const channelConfigOfActiveMessage = workspaceChannels.find(
                (channel) => channel.token === actMessage.channelConfigToken
            );

            if (!channelConfigOfActiveMessage) return;

            return {
                id: actMessage.id,
                name: actMessage?.settingName || channelConfigOfActiveMessage?.name,
                channelId: channelConfigOfActiveMessage?.channelId,
            };
        });

        return modelList || [];
    };

    return (
        <Wrapper>
            {loading ? (
                <SkeletonLines
                    rows={1}
                    style={{
                        padding: '13px 15px',
                        margin: '0 0 3px 0',
                        height: '50px',
                        borderRadius: '6px',
                    }}
                />
            ) : workspaceActiveMessage.length && workspaceChannels.length && transformModelList().length ? (
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
                        {getTranslation('Integration active message')}
                    </Wrapper>
                    {transformModelList().map((el) => {
                        return (
                            <ActiveMessageItem
                                key={el?.id}
                                addNotification={addNotification}
                                workspaceId={workspaceId}
                                activeMessage={el}
                                onDeletedActiveMessage={onDeletedActiveMessage}
                                onEditActiveMessage={onEditActiveMessage}
                                canDelete={userCanDelete}
                            />
                        );
                    })}
                </div>
            ) : (
                <Wrapper height='150px' flexBox margin='30px 0 0 0' justifyContent='center' alignItems='center'>
                    <Wrapper>
                        <Wrapper flexBox justifyContent='center'>
                            <EmptyImage src='/assets/img/empty_draw.svg' />
                        </Wrapper>
                        <Wrapper fontSize='13px' margin='15px 0 0 0'>
                            {getTranslation('No active message integration found')}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrapper>
    );
};

export default i18n(ActiveMessageList) as FC<ActiveMessageListProps>;
