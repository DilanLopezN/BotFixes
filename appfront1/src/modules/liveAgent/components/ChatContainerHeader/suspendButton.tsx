import React, { useState, FC, useEffect } from 'react';
import { Button, Modal, Checkbox, DatePicker } from 'antd';
import 'moment/locale/pt-br';
import moment from 'moment';
import i18n from '../../../i18n/components/i18n';
import locale from 'antd/es/date-picker/locale/pt_BR';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { User } from 'kissbot-core';
import { ConversationCardData } from '../ConversationCard/props';
import { StyledCheckboxContainer } from './styled';

interface SuspendButtonProps {
    workspaceId: string;
    loggedUser: User;
    conversation: ConversationCardData;
    addNotification: Function;
    onSuspendConversation: (until: number) => any;
    isOpenedModal: boolean;
    setIsOpenedModal: (isOpen: boolean) => void;
}

const SuspendButton: FC<SuspendButtonProps & I18nProps> = ({
    getTranslation,
    onSuspendConversation,
    isOpenedModal,
    setIsOpenedModal,
    conversation,
}) => {
    const [dateTimestamp, setDateTimestamp] = useState<number | undefined>(undefined);
    const [checked, setChecked] = useState<boolean[]>([false, false, false, false, false]);
    const [dateSelect, setDateSelect] = useState<boolean>(false);

    const onSuspend = () => {
        onSuspendConversation(dateTimestamp || moment().add(1, 'day').valueOf());
        setIsOpenedModal(false);
    };

    useEffect(() => {
        handleScape();
    }, []);

    useEffect(() => {
        setChecked([false, false, false, false, false]);
    }, [isOpenedModal]);

    const handleScape = () => {
        document.onkeydown = (event) => {
            if (event.key === 'Escape') {
                setIsOpenedModal(false);
            }
        };
    };

    const onChange = (event, index) => {
        const array = [false, false, false, false, false];
        array[index] = event.target.checked;
        setChecked(array);

        const date = array.findIndex((e) => e === true);

        switch (date) {
            case 0:
                setDateSelect(false);
                setDateTimestamp(moment().add(15, 'm').valueOf());
                break;
            case 1:
                setDateSelect(false);
                setDateTimestamp(moment().add(30, 'm').valueOf());
                break;
            case 2:
                setDateSelect(false);
                setDateTimestamp(moment().add(1, 'h').valueOf());
                break;
            case 3:
                setDateSelect(false);
                setDateTimestamp(moment(moment().add(1, 'day').format('YYYY-MM-DD 08:00')).valueOf());
                break;
            case 4:
                setDateSelect(true);
                break;
            default:
                break;
        }
    };

    const disableDate = (current) => {
        return current && current < moment().endOf('day').subtract(1, 'day');
    };

    return (
        <Modal
            width={420}
            title={getTranslation('Suspend')}
            open={isOpenedModal}
            onCancel={() => setIsOpenedModal(false)}
            footer={
                <>
                    <Button className='antd-span-default-color' onClick={() => setIsOpenedModal(false)}>
                        {getTranslation('Exit')}
                    </Button>
                    <Button
                        disabled={!dateTimestamp || conversation?.isWithSmtRe}
                        onClick={() => {
                            onSuspend();
                        }}
                        type='primary'
                        className='antd-span-default-color'
                        style={{ marginLeft: '10px' }}
                        title={
                            conversation?.isWithSmtRe
                                ? getTranslation('Disabled while REMI is controlling the service.')
                                : undefined
                        }
                    >
                        {getTranslation('Suspend')}
                    </Button>
                </>
            }
        >
            <StyledCheckboxContainer>
                <Checkbox
                    checked={checked[0]}
                    onChange={(e) => {
                        onChange(e, 0);
                        !e.target.checked && setDateTimestamp(undefined);
                    }}
                >
                    {`${getTranslation('Per')}: 15 Min`}
                </Checkbox>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {`${moment().add(15, 'm').format('ddd HH:mm')}`}
                </div>
            </StyledCheckboxContainer>
            <StyledCheckboxContainer>
                <Checkbox
                    checked={checked[1]}
                    onChange={(e) => {
                        onChange(e, 1);
                        !e.target.checked && setDateTimestamp(undefined);
                    }}
                >
                    {`${getTranslation('Per')}: 30 Min`}
                </Checkbox>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {`${moment().add(30, 'm').format('ddd HH:mm')}`}
                </div>
            </StyledCheckboxContainer>
            <StyledCheckboxContainer>
                <Checkbox
                    checked={checked[2]}
                    onChange={(e) => {
                        onChange(e, 2);
                        !e.target.checked && setDateTimestamp(undefined);
                    }}
                >
                    {`${getTranslation('Per')}: 01 Hora`}
                </Checkbox>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {`${moment().add(1, 'h').format('ddd HH:mm')}`}
                </div>
            </StyledCheckboxContainer>
            <StyledCheckboxContainer>
                <Checkbox
                    checked={checked[3]}
                    onChange={(e) => {
                        onChange(e, 3);
                        !e.target.checked && setDateTimestamp(undefined);
                    }}
                >
                    {`${getTranslation('Per')}: 01 Dia`}
                </Checkbox>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {`${moment().add(1, 'day').format('ddd 08:00')}`}
                </div>
            </StyledCheckboxContainer>
            <StyledCheckboxContainer>
                <Checkbox
                    checked={checked[4]}
                    onChange={(e) => {
                        onChange(e, 4);
                        !e.target.checked && setDateSelect(false);
                    }}
                >
                    {`${getTranslation('Choose date and time')}`}
                </Checkbox>
                <br />
                {dateSelect ? (
                    <DatePicker
                        format='YYYY-MM-DD HH:mm'
                        showTime={{ format: 'HH:mm' }}
                        disabledDate={disableDate}
                        locale={locale}
                        onChange={(date) => {
                            setDateTimestamp(date?.valueOf());
                        }}
                    />
                ) : (
                    <div style={{ height: '32px' }} />
                )}{' '}
            </StyledCheckboxContainer>
        </Modal>
    );
};

export default i18n(SuspendButton) as FC<SuspendButtonProps>;
