import { ChannelIdConfig } from 'kissbot-core';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { ModalConfirm } from '../../../../../../shared/ModalConfirm/ModalConfirm';
import { Icon, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { CampaignsService } from '../../../../service/CampaignsService';
import { ActiveMessageItemProps } from './props';
import { APP_TYPE_PORT, getBaseUrl } from '../../../../../../utils/redirectApp';

const Item = styled(Wrapper)`
    height: 45px;
    width: 1100px;
    min-width: 320px;
    transition: background-color 0.2s;

    &:hover {
        background-color: #f2f4f8;
    }
`;

const Options = styled(Wrapper)`
    display: none;

    ${Item}:hover & {
        display: flex;
    }

    > :hover {
        color: #1890ff;
    }
`;

const ActiveMessageItem: FC<ActiveMessageItemProps & I18nProps> = (props) => {
    const { workspaceId, addNotification, getTranslation, activeMessage, onDeletedActiveMessage, onEditActiveMessage } =
        props;

    const [withError, setWithError] = useState<any>(undefined);
    const [deleteActive, setDeleteActive] = useState<boolean>(false);

    const onDeleteActive = async () => {
        if (!activeMessage.id) {
            return;
        }

        await CampaignsService.deleteActiveMessage(workspaceId, activeMessage.id, (err: any) => {
            setWithError(err);
        });

        if (!withError) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Successfully deleted'),
            });

            return onDeletedActiveMessage(activeMessage.id);
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };
    return (
        <>
            <ModalConfirm
                isOpened={deleteActive}
                onAction={(action: any) => {
                    if (action) {
                        onDeleteActive();
                    }
                    setDeleteActive(false);
                }}
            >
                <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                <p style={{ margin: '10px 0px 17px' }}>
                    {getTranslation('Are you sure you want to delete the integration active message?')}
                </p>
            </ModalConfirm>

            <Wrapper cursor='pointer' borderBottom='1px #CED4DA solid' width='100%'>
                <Item
                    bgcolor={'#fff'}
                    width='auto !important'
                    padding='8px 15px'
                    onClick={(e) => {
                        onEditActiveMessage(activeMessage.id);
                    }}
                    onMouseDown={(e) => {
                        if (e.ctrlKey || e.button === 1) {
                            return window.open(
                                getBaseUrl({
                                    appTypePort: APP_TYPE_PORT.APP,
                                    pathname: `/campaigns/active-message-settings/${activeMessage.id}`,
                                }),
                                '_blank'
                            );
                        }
                    }}
                >
                    <Wrapper justifyContent='space-between' alignItems='center' flexBox>
                        <Wrapper flexBox alignItems='center'>
                            {activeMessage?.channelId === ChannelIdConfig.whatsapp ||
                            activeMessage?.channelId === ChannelIdConfig.whatsweb ||
                            activeMessage?.channelId === ChannelIdConfig.gupshup ? (
                                <Icon size='18px' name='whatsapp' style={{ margin: '0 10px 0 0' }} />
                            ) : null}
                            {activeMessage && (
                                <Wrapper fontSize='15px' color='#444' truncate fontWeight='600'>
                                    {activeMessage.name}
                                </Wrapper>
                            )}
                        </Wrapper>
                        <Options>
                            <Icon
                                size='18'
                                margin='0 0 0 9px'
                                name='delete'
                                title={getTranslation('Delete')}
                                onClick={(event: any) => {
                                    event.stopPropagation();
                                    setDeleteActive(true);
                                }}
                            />
                        </Options>
                    </Wrapper>
                </Item>
            </Wrapper>
        </>
    );
};

export default i18n(ActiveMessageItem) as FC<ActiveMessageItemProps>;
