import { FC, useEffect, useState } from 'react';
import { GrFormClose } from 'react-icons/gr';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { connect } from 'react-redux';
import { TextLink } from '../../../../../../shared/TextLink/styled';
import { Icon, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { validatePhoneNumber } from '../../../../../../utils/validatePhoneNumber';
import I18n from '../../../../../i18n/components/i18n';
import { LiveAgentService } from '../../../../service/LiveAgent.service';
import ChannelSelector from '../../../ChannelSelector';
import { ConversationCard } from '../../../ConversationCard';
import { NewConversationsProps } from './props';

const NewConversationsComponent: FC<NewConversationsProps> = ({
    workspaceId,
    loggedUser,
    getTranslation,
    onOpenConversation,
    createNewConversation,
    teams,
    notification,
    channels,
}) => {
    const [phoneNumber, setPhoneNumber] = useState<string>('55');
    const [ddi, setDdi] = useState<string>('55');
    const [loadingValidation, setLoadingValidation] = useState(false);
    const [validPhoneNumber, setValidPhoneNumber] = useState(false);
    const [invalidChannelTokenToOpen, setInvalidChannelTokenToOpen] = useState<string[]>([]);
    const [disabledOpenConversation, setDisabledOpenConversation] = useState(false);
    const [conversations, setConversations] = useState<any>(false);
    const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
    const [phonePersonalized, setPhonePersonalized] = useState(false);

    useEffect(() => {
        validPhoneNumber &&
            phoneNumber &&
            phoneNumber.length > 8 &&
            (async function updateValidPhone() {
                let formatPhone = getFormatPhone();

                setLoadingValidation(true);
                let error: any;
                const response = await LiveAgentService.checkPhoneStatus(formatPhone, ddi, workspaceId, undefined, (err) => {
                    error = err;
                });

                if (error) {
                    return notification({
                        title: getTranslation('Warning'),
                        message: `${getTranslation('No channels available to validate the number')}.`,
                        type: 'warning',
                    });
                }

                if (response?.conversationByChannel?.length) {
                    let invalidChannels: string[] = [];
                    const conversations = response?.conversationByChannel
                        ?.filter((curr) => !!curr?.conversation)
                        .map((conv) => {
                            invalidChannels.push(conv.channelConfigToken);
                            if (!conv.conversation.activities) conv.conversation.activities = [];
                            return conv.conversation;
                        });
                    if (conversations?.length) {
                        if (conversations.length === response.conversationByChannel.length) {
                            setDisabledOpenConversation(true);
                        }
                        setConversations(LiveAgentService.transformConversations(conversations, loggedUser) || {});
                    } else {
                        setConversations(false);
                    }
                    setInvalidChannelTokenToOpen(invalidChannels);
                    setLoadingValidation(false);
                }
                setWhatsappNumber(response?.contact?.whatsapp || formatPhone);
            })();
    }, [validPhoneNumber]);

    const openConversation = (e) => {
        !!e && e.preventDefault();

        const arrConversations: any[] = Object.values(conversations || {});
        if (!arrConversations.length) {
            return;
        }
        onOpenConversation(arrConversations[0]._id);
    };

    const onResetStates = () => {
        setValidPhoneNumber(false);
        setConversations(false);
        setWhatsappNumber(null);
        setDisabledOpenConversation(false);
        setInvalidChannelTokenToOpen([]);
    };

    const getFormatPhone = () => {
        let formatPhone = phoneNumber;

        if (!phoneNumber) {
            return phoneNumber;
        }

        if (phonePersonalized && phoneNumber.startsWith('5508')) {
            formatPhone = phoneNumber.slice(2);
        } else {
            formatPhone = phoneNumber.slice(ddi.length);
        }
        return formatPhone;
    };

    return (
        <Wrapper className='conversationContainer'>
            <Wrapper borderTop='1px #e8e8e8 solid' borderBottom='1px #e8e8e8 solid' height='65px' bgcolor='#f8f8f8'>
                <Wrapper flexBox alignItems='center' justifyContent='space-between' height='65px' padding='12px 5px'>
                    <Wrapper className='input-group'>
                        <PhoneInput
                            key={phonePersonalized ? 'personalized' : ''}
                            enableSearch
                            inputClass='input-phone-number'
                            value={phoneNumber}
                            masks={{
                                br: ['(..) ..... ....'],
                                ar: ['. ... ... ....'],
                                py: ['(...) ... ...'],
                            }}
                            prefix={phonePersonalized ? '' : '+'}
                            inputProps={{ autoFocus: true }}
                            inputStyle={{ width: '100%' }}
                            disableDropdown={validPhoneNumber}
                            countryCodeEditable={false}
                            enableTerritories
                            country={'br'}
                            isValid={(inputNumber, country: any, countries) => {
                                setDdi(country.countryCode);
                                return validatePhoneNumber({
                                    countries,
                                    country,
                                    inputNumber,
                                    phonePersonalized,
                                    setPhonePersonalized,
                                    setValidPhoneNumber,
                                });
                            }}
                            onChange={(value) => {
                                if (validPhoneNumber) {
                                    onResetStates();
                                }
                                setPhoneNumber(value);
                            }}
                        />

                        {!!loadingValidation && !whatsappNumber && (
                            <span className='loading form-control-feedback'></span>
                        )}
                        {!loadingValidation && phoneNumber?.length && phoneNumber.length > 2 ? (
                            <GrFormClose
                                onClick={() => {
                                    onResetStates();
                                    setPhoneNumber('55');
                                    setDdi('55');
                                    const elements = document.getElementsByClassName('input-phone-number');
                                    if (elements.length) {
                                        const input = elements[0] as HTMLInputElement;
                                        input.focus();
                                    }
                                }}
                                style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    right: '14px',
                                    top: '7px',
                                    fontSize: '20px',
                                }}
                            />
                        ) : null}
                    </Wrapper>
                </Wrapper>
            </Wrapper>

            {whatsappNumber && !disabledOpenConversation && (
                <Wrapper bgcolor='#ffffff' flexBox height='auto' cursor='pointer'>
                    <Wrapper padding='8px 0 8px 8px'>
                        <Wrapper bgcolor='#25d366' borderRadius='50%' height='50px' width='50px'>
                            <Icon
                                name='whatsapp'
                                color='#ffffff'
                                padding='0 0 0 8px'
                                iconMargin='-1px 0 0 -1px'
                                size='36px'
                            />
                        </Wrapper>
                    </Wrapper>

                    <Wrapper flexBox column padding='8px' width='100%' borderBottom='1px solid #F0F0F0'>
                        <Wrapper className='validateNumberAlertTitle'>
                            {getTranslation('Avaliable on whatsapp')}
                        </Wrapper>
                        <Wrapper className='validateNumberAlertSubTitle' style={{ display: 'flex' }}>
                            <ChannelSelector
                                onChannelSelected={({ channelConfig, team }) => {
                                    if (!phoneNumber || !team || !channelConfig) return;

                                    let formatPhone = getFormatPhone()

                                    createNewConversation({
                                        channel: channelConfig,
                                        teamId: team._id,
                                        phone: {
                                            phoneId: phoneNumber,
                                            phoneNumber: formatPhone,
                                            ddi,
                                        },
                                    });
                                }}
                                invalidChannelConfigTokensToOpenConversation={invalidChannelTokenToOpen}
                                contactPhone={getFormatPhone()}
                                ddi={ddi}
                                workspaceId={workspaceId}
                            >
                                <span
                                    style={{
                                        color: '#1890ff',
                                        textDecoration: 'underline',
                                    }}
                                >
                                    {getTranslation('Click here')}
                                </span>
                            </ChannelSelector>
                            &nbsp;
                            {getTranslation('to start a conversation.')}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            )}

            {!!conversations && (
                <div>
                    <Wrapper bgcolor='#ffffff' flexBox height='auto' onClick={openConversation} cursor='pointer'>
                        <Wrapper padding='8px 0 8px 8px'>
                            <Wrapper bgcolor='#fed859' borderRadius='50%' height='50px' width='50px'>
                                <Icon
                                    name='alert-outline'
                                    color='#ffffff'
                                    padding='0 0 0 8px'
                                    iconMargin='-3px 0 0 -1px'
                                    size='36px'
                                />
                            </Wrapper>
                        </Wrapper>

                        <Wrapper flexBox column padding='8px' width='100%' borderBottom='1px solid #F0F0F0'>
                            <Wrapper className='validateNumberAlertTitle'>
                                {getTranslation('Have an open conversation')}
                            </Wrapper>
                            <Wrapper className='validateNumberAlertSubTitle'>
                                {getTranslation('This number have an opened conversation.')}
                                <br />
                                <TextLink id='clickLink' href='#' onClick={(e) => e.preventDefault()}>
                                    {getTranslation('Click here')}
                                </TextLink>
                                &nbsp;
                                {getTranslation('to open a conversation.')}
                            </Wrapper>
                        </Wrapper>
                    </Wrapper>
                    {conversations &&
                        loggedUser &&
                        Object.values(conversations).map((conversation: any) => (
                            <ConversationCard
                                className={`ConversationCard:${conversation._id}`}
                                key={`conversationAwaitingCard${conversation._id}`}
                                loggedUser={loggedUser}
                                onClick={openConversation}
                                conversation={conversation}
                                workspaceId={workspaceId}
                                teams={teams}
                                channels={channels}
                            />
                        ))}
                </div>
            )}
        </Wrapper>
    );
};

const mapStateToProps = (state) => ({
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

const mapDispatchToProps = {};

export const NewConversations = connect(mapStateToProps, mapDispatchToProps)(I18n(NewConversationsComponent));
