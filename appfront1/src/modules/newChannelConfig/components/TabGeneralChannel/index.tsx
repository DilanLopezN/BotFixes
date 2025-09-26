import React, { FC, useEffect } from 'react';
import { TabGeneralChannelProps } from './props';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import I18n from '../../../i18n/components/i18n';
import { Constants } from '../../../../utils/Constants';
import './style.scss';
import Toggle from '../../../../shared/Toggle/Toggle';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { FormikProps } from 'formik';
import { TextLink } from '../../../../shared/TextLink/styled';
import { ChannelIdConfig } from 'kissbot-core';
import { Alert, Card, Space, Row, Col } from 'antd';
declare var window: any;

const TabGeneralChannel: FC<TabGeneralChannelProps & I18nProps & FormikProps<any>> = (props) => {
    const { getTranslation, channel, setFieldValue, values, onChange, selectedMenu } = props;

    useEffect(() => {
        if (JSON.stringify(channel) !== JSON.stringify(values.channel)) onChange(values.channel);
    }, [values.channel]);

    const copy = () => {
        const element = document.getElementById('copy');
        const range = document.createRange();
        if (element) {
            range.selectNode(element);
            if (window.getSelection() !== null) {
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                window.getSelection().removeAllRanges();
            }
        }
    };

    const existExpirationTime = () => {
        const { expirationTime } = values.channel;
        return expirationTime && expirationTime.time !== undefined && !!expirationTime.timeType;
    };

    return (
        <div
            className='TabGeneralChannel'
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                overflowY: 'auto',
                width: '100%',
            }}
        >
            <Wrapper width='100%'>
                {selectedMenu.sections[0].showOnChannelIdEquals.includes(channel.channelId) && (
                    <Card title={getTranslation('General settings')}>
                        <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                            <div>
                                <LabelWrapper label={getTranslation('Channel name')}>
                                    <StyledFormikField
                                        name={`channel.name`}
                                        placeholder={getTranslation('Channel name')}
                                    />
                                </LabelWrapper>
                                <div style={{ margin: '15px 0 25px 0' }}>
                                    {`${getTranslation('Channel token')}: ${channel.token}`}
                                </div>

                                {channel.channelId === 'webemulator' && (
                                    <div style={{ margin: '-20px 0 20px 0 !important' }}>
                                        <TextLink
                                            href={`http://demo.botdesigner.io/?channelId=${channel._id}`}
                                            target='_blank'
                                        >
                                            {getTranslation('Go to Demo')}
                                        </TextLink>
                                    </div>
                                )}
                                {channel &&
                                    channel.channelId === 'whatsapp-gupshup' &&
                                    channel.configData &&
                                    channel.configData.phoneNumber && (
                                        <div style={{ margin: '-20px 0 20px 0 !important' }}>
                                            <TextLink
                                                href={`https://api.whatsapp.com/send?phone=${channel.configData.phoneNumber}`}
                                                target='_blank'
                                            >
                                                {getTranslation('Go to WhatsApp')}
                                            </TextLink>
                                        </div>
                                    )}
                            </div>

                            <Row gutter={16}>
                                <Col span={24} md={12}>
                                    <Row align='middle'>
                                        <Col>
                                            <Toggle
                                                checked={values.channel.enable}
                                                onChange={() => setFieldValue('channel.enable', !values.channel.enable)}
                                            />
                                        </Col>
                                        <Col style={{ marginLeft: '15px' }}>{getTranslation('Enable channel')}</Col>
                                    </Row>
                                </Col>
                                <Col span={24} md={12}>
                                    <Row align='middle'>
                                        <Col>
                                            <Toggle
                                                checked={values.channel.canStartConversation}
                                                onChange={() =>
                                                    setFieldValue(
                                                        'channel.canStartConversation',
                                                        !values.channel.canStartConversation
                                                    )
                                                }
                                            />
                                        </Col>
                                        <Col style={{ marginLeft: '15px' }}>
                                            {getTranslation('Can start conversation')}
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={24} md={12}>
                                    <Row align='middle'>
                                        <Col>
                                            <Toggle
                                                checked={values.channel.canValidateNumber}
                                                onChange={() =>
                                                    setFieldValue(
                                                        'channel.canValidateNumber',
                                                        !values.channel.canValidateNumber
                                                    )
                                                }
                                            />
                                        </Col>
                                        <Col style={{ marginLeft: '15px' }}>
                                            {getTranslation('Can validate number')}
                                        </Col>
                                    </Row>
                                </Col>

                                {channel.channelId === ChannelIdConfig.gupshup && (
                                    <Col span={24} md={12}>
                                        <Row align='middle'>
                                            <Col>
                                                <Toggle
                                                    checked={values.channel.blockInboundAttendance}
                                                    onChange={() =>
                                                        setFieldValue(
                                                            'channel.blockInboundAttendance',
                                                            !values.channel.blockInboundAttendance
                                                        )
                                                    }
                                                />
                                            </Col>
                                            <Col style={{ marginLeft: '15px' }}>
                                                {getTranslation('Block incoming interactions')}
                                            </Col>
                                        </Row>
                                    </Col>
                                )}
                            </Row>

                            <Row>
                                <Col span={24}>
                                    <Row align='middle'>
                                        <Col>
                                            <Toggle
                                                checked={existExpirationTime()}
                                                onChange={() => {
                                                    if (!existExpirationTime()) {
                                                        setFieldValue('channel.expirationTime', {
                                                            time: 1,
                                                            timeType: 'minute',
                                                        });
                                                    } else {
                                                        setFieldValue('channel.expirationTime', {});
                                                    }
                                                }}
                                            />
                                        </Col>
                                        <Col style={{ marginLeft: '15px' }}>
                                            {getTranslation('Expiring attendance')}
                                        </Col>
                                    </Row>

                                    {existExpirationTime() && (
                                        <>
                                            <Row gutter={16} align='middle' style={{ marginTop: '15px 0 0 0' }}>
                                                <Col span={24}>
                                                    <LabelWrapper label={getTranslation('Expiration of attendance')}>
                                                        <Space size='middle'>
                                                            <StyledFormikField
                                                                type='number'
                                                                min='1'
                                                                name='channel.expirationTime.time'
                                                                placeholder={getTranslation('Expiration of attendance')}
                                                                style={{ width: '120px' }}
                                                            />

                                                            <StyledFormikField
                                                                name='channel.expirationTime.timeType'
                                                                component='select'
                                                                style={{ width: '120px' }}
                                                            >
                                                                <option value='minute'>
                                                                    {getTranslation('Minutes')}
                                                                </option>
                                                                <option value='hour'>{getTranslation('Hours')}</option>
                                                            </StyledFormikField>
                                                        </Space>
                                                    </LabelWrapper>
                                                </Col>
                                            </Row>
                                            <Row style={{ marginTop: '15px' }}>
                                                <Col span={24}>
                                                    <Alert
                                                        message={getTranslation(
                                                            'At half of the configured time, the "before_end_conversation" interaction is triggered. Its purpose is to re-engage the patient who became inactive in the flow.'
                                                        )}
                                                        description={getTranslation(
                                                            'Ex: If the total time is 1 hour, this interaction will be triggered at 30 minutes; when the full hour is reached, the session will be automatically finalized by the bot.'
                                                        )}
                                                        type='warning'
                                                    />
                                                </Col>
                                            </Row>
                                        </>
                                    )}
                                </Col>
                            </Row>
                        </Space>
                    </Card>
                )}

                {selectedMenu.sections[2].showOnChannelIdEquals.includes(channel.channelId) && (
                    <Card title={getTranslation('Closure')}>
                        <Wrapper>
                            <LabelWrapper label={getTranslation('Standard conversation end message')}>
                                <StyledFormikField
                                    name='channel.endMessage'
                                    component='textarea'
                                    style={{
                                        resize: 'none',
                                        fontSize: '13px !important',
                                    }}
                                />
                            </LabelWrapper>
                        </Wrapper>
                    </Card>
                )}

                {selectedMenu.sections[1].showOnChannelIdEquals.includes(channel.channelId) && (
                    <Card title={getTranslation('Installation')}>
                        <LabelWrapper label={getTranslation('Code to place the bot on your website')}>
                            <Wrapper className='code'>
                                <Wrapper position='absolute' right='4px' top='4px' cursor='pointer' color='#FFF'>
                                    <span
                                        className='mdi mdi-24px mdi-content-copy'
                                        style={{ color: '#FFF' }}
                                        onClick={copy}
                                        title={getTranslation('Copy')}
                                    />
                                </Wrapper>
                                <div
                                    id='copy'
                                    style={{
                                        color: '#dedddd',
                                        fontSize: '14px',
                                    }}
                                >
                                    {`<script>(function(w,d,s,u,a,v){if(!w[a]){const sc=d.createElement(s);sc.src=u+'?v='+v;d.head.appendChild(sc);sc.onload=function(){w[a].mount({channelConfigId:'${channel._id}'})}}})(window,document,'script', '${Constants.WEBCHAT_LAUNCHER_URL}','KissbotWidget', new Date().getTime());</script>`}
                                </div>
                            </Wrapper>
                            <Wrapper flexBox justifyContent='flex-end' color='#555' margin='5px 0'>
                                {`* ${getTranslation("Copy the snippet and paste it into your site's <head> tag")}`}
                            </Wrapper>
                        </LabelWrapper>
                    </Card>
                )}
            </Wrapper>
        </div>
    );
};

export default I18n(TabGeneralChannel) as FC<TabGeneralChannelProps>;
