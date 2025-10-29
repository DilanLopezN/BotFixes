import { Button } from 'antd';
import { FC } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType } from '../../../../ui-kissbot-v2/theme';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import ChannelSelector from '../ChannelSelector';

interface NewAttendanceButtonProps {
    workspaceId: string;
    contactId?: string;
    contactPhone?: string;
    ddi?: string;
    notification: Function;
}

const NewAttendanceButton = ({
    getTranslation,
    workspaceId,
    contactId,
    contactPhone,
    ddi,
    notification,
}: NewAttendanceButtonProps & I18nProps) => {
    const createNewConversation = (params: any) => {
        if (!params.contactId) {
            return notification({
                title: getTranslation('Error'),
                message: getTranslation('We were unable to create a conversation for this contact'),
                type: 'danger',
                duration: 3000,
            });
        }

        const event = new CustomEvent('@conversation_create_request', {
            detail: {
                params,
            },
        });
        return window.dispatchEvent(event);
    };

    return (
        <Wrapper title={getTranslation('New conversation')}>
            <ChannelSelector
                onChannelSelected={({ channelConfig, team }) =>
                    createNewConversation({
                        channel: channelConfig,
                        teamId: team._id,
                        contactId,
                    })
                }
                contactPhone={contactPhone || null}
                ddi={ddi || '55'}
                contactId={contactId}
                workspaceId={workspaceId}
            >
                <Button type='primary' ghost className='antd-span-default-color'>
                    {getTranslation('New conversation')}
                </Button>
            </ChannelSelector>
        </Wrapper>
    );
};

export default i18n(NewAttendanceButton) as FC<NewAttendanceButtonProps>;
