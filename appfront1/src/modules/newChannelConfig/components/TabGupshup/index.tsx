import React, { FC, useEffect, useState } from 'react';
import { TabGupshupProps } from './props';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import I18n from '../../../i18n/components/i18n';
import DivisorCard from '../DivisorCard';
import { StyledFormikField } from '../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import styled from 'styled-components';
import MaskedInput from 'react-text-mask';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { FormikProps } from 'formik';
import { Alert, Button, Input, Modal, Row, Select, Typography } from 'antd';
import { ChannelConfigService } from '../../service/ChannelConfigService';
import { addNotification } from '../../../../utils/AddNotification';

export const PhoneInput = styled(MaskedInput)`
    box-shadow: 0 2px 15px 0 rgba(0, 0, 0, 0.07);
    background: #ffffff;
    border: 1px solid #e4e9f0 !important;
    color: #696969;
    padding: 9px 24px 9px 19px !important;
    font-size: 15px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    min-height: 42px;
    border-radius: 3px !important;
    outline: none;
    width: 100%;
    ::placeholder {
        color: #d8e4ec;
    }
`;

const { Paragraph, Text } = Typography;

const TabGupshup: FC<TabGupshupProps & I18nProps & FormikProps<any>> = (props) => {
    const { getTranslation, values, setFieldValue, onChange, channel, selectedMenu } = props;
    const [modalOpen, setModalOpen] = useState(false);
    const [clientName, setClientName] = useState('');

    useEffect(() => {
        if (JSON.stringify(channel) !== JSON.stringify(values.channel)) onChange(values.channel);
    }, [values.channel]);

    const phoneMask = [
        /[1-9]/,
        /\d/,
        ' ',
        '(',
        /\d/,
        /\d/,
        ')',
        ' ',
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        '-',
        /\d/,
        /\d/,
        /\d/,
        /\d/,
    ];

    const onChangeSearchInput = (e) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        setFieldValue('channel.configData.phoneNumber', rawValue);
    };

    const createTemplates = async () => {
        if (!channel?.workspaceId || !channel?._id || !clientName){
            return;
        }

        setModalOpen(false);
        addNotification({message: 'Os templates estão sendo criados!', type: 'success'})
        await ChannelConfigService.createDefaultTemplates(channel.workspaceId, channel._id!, clientName )
    };

    return (
        <Wrapper flexBox flexDirection='column' alignItems='center' height='100%'>
            {selectedMenu.sections[0].showOnChannelIdEquals.includes(channel.channelId) && (
                <DivisorCard title={getTranslation('Configuration')}>
                    <Modal
                        open={modalOpen}
                        title='Criação dos templates oficiais para WhatsApp'
                        onOk={() => {
                            createTemplates();
                        }}
                        okButtonProps={{disabled: !clientName, className: 'antd-span-default-color'}}
                        cancelButtonProps={{className: 'antd-span-default-color'}}
                        okText='Criar templates'
                        onCancel={() => setModalOpen(false)}
                    >
                        <Alert
                            showIcon
                            message='Atenção: Caso os templates já tenham sido criados alguma vez, eles ficaram duplicados.'
                            type='warning'
                        />
                        <LabelWrapper
                            validate={{
                                isSubmitted: true,
                                errors: !clientName ? { clientName: 'Campo obrigatório' } : undefined,
                                fieldName: 'clientName',
                                touched: true,
                            }}
                            label={getTranslation('Nome do cliente para os templates')}
                        >
                            <Input placeholder='do Hospital Botdesigner' onChange={(event) => setClientName(event.target.value)} />
                        </LabelWrapper>
                        <Paragraph>
                            <strong>Exemplo:</strong>
                            <br />
                            <Text
                                mark
                            >{`Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName ? clientName : '{{client.name}}'}, tudo bem? Podemos continuar nossa conversa por aqui?`}</Text>
                        </Paragraph>
                    </Modal>
                    <LabelWrapper label={getTranslation('WhatsApp Provider')}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder={getTranslation('Selecione o provedor')}
                            value={values.channel?.whatsappProvider || null}
                            onChange={(value) => setFieldValue('channel.whatsappProvider', value)}
                            allowClear
                        >
                            <Select.Option value={null}>Vazio</Select.Option>
                            <Select.Option value="gupshupv3">Gupshup V3</Select.Option>
                            <Select.Option value="d360">360Dialog</Select.Option>
                        </Select>
                    </LabelWrapper>
                    {values.channel?.whatsappProvider === 'd360' ? (
                        <LabelWrapper label={getTranslation('360Dialog Api Key')}>
                            <StyledFormikField name={`channel.configData.d360ApiKey`} placeholder={getTranslation('360Dialog Api Key')} />
                        </LabelWrapper>
                    ) : (
                        <>
                            <LabelWrapper label={getTranslation('Api key')}>
                                <StyledFormikField name={`channel.configData.apikey`} placeholder={getTranslation('Api key')} />
                            </LabelWrapper>
                            <LabelWrapper label={getTranslation('App name')}>
                                <StyledFormikField
                                    name={`channel.configData.appName`}
                                    placeholder={getTranslation('App name')}
                                />
                            </LabelWrapper>
                            <Wrapper maxWidth='260px'>
                                <LabelWrapper label={getTranslation('Phone number')}>
                                    <PhoneInput
                                        className='form-control form-control-sm'
                                        name='channel.configData.phoneNumber'
                                        type='text'
                                        placeholder={getTranslation('Phone number')}
                                        onChange={onChangeSearchInput}
                                        mask={phoneMask}
                                        value={values.channel.configData.phoneNumber}
                                    />
                                </LabelWrapper>
                            </Wrapper>
                        </>
                    )}
                    {
                        !!channel?.configData?.appName ? (
                            <Row justify={'end'}>
                                <Button className='antd-span-default-color' type='primary' onClick={() => setModalOpen(true)}>
                                    {getTranslation('Criar templates oficiais padrão')}
                                </Button>
                            </Row>
                        ) : null
                    }
                </DivisorCard>
            )}
        </Wrapper>
    );
};

export default I18n(TabGupshup) as FC<TabGupshupProps>;
