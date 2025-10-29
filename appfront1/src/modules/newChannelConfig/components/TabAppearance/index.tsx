import React, { FC, useEffect, useState } from 'react';
import { TabAppearanceProps } from './props';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import I18n from '../../../i18n/components/i18n';
import DivisorCard from '../DivisorCard';
import InputColor from '../../../../shared/StyledForms/InputColor';
import Toggle from '../../../../shared/Toggle/Toggle';
import { ChannelIdConfig } from 'kissbot-core';
import { InputSimple } from '../../../../shared/InputSample/InputSimple';
import { Button, Upload } from 'antd';
import { fileToBase64 } from '../../../../utils/File';
import { BiUpload } from 'react-icons/bi';

const TabAppearance: FC<TabAppearanceProps> = (props) => {
    const { getTranslation, values, onChange, channel, setFieldValue, selectedMenu, setFile } = props;

    const [url, setUrl] = useState(channel.configData.avatar || '');

    useEffect(() => {
        if (JSON.stringify(channel) !== JSON.stringify(values.channel)) onChange(values.channel);
    }, [values.channel]);

    return (
        <Wrapper flexBox flexDirection='column' alignItems='center' height='100%' overflowY={'auto'}>
            <Wrapper width='100%'>
                {selectedMenu.sections[0].showOnChannelIdEquals.includes(channel.channelId) && (
                    <DivisorCard title={getTranslation('Definitions')}>
                        <Wrapper>
                            <LabelWrapper label={getTranslation('Chat title')}>
                                <StyledFormikField
                                    name={`channel.configData.chatTitle`}
                                    placeholder={getTranslation('Chat title')}
                                />
                            </LabelWrapper>
                        </Wrapper>

                        <Wrapper flexBox>
                            <Wrapper width='70%'>
                                <LabelWrapper label={getTranslation('Avatar link')}>
                                    <Upload
                                        name={`channel.configData.avatar`}
                                        accept='image/jpg,image/jpeg,image/png'
                                        showUploadList
                                        customRequest={() => {}}
                                        fileList={
                                            url
                                                ? [
                                                      {
                                                          uid: '1',
                                                          name: 'avatar',
                                                          status: 'done',
                                                          size: 1234,
                                                          type: '',
                                                          url: url,
                                                      },
                                                  ]
                                                : []
                                        }
                                        onPreview={(file) => {
                                            window.open()?.document.write('<iframe src="' + file.url + '" frameborder="0" style="width:100%; height:100%;" allowfullscreen></iframe>');
                                        }}
                                        multiple={false}
                                        onChange={async ({ file, fileList }) => {
                                            if (fileList?.length === 0) {
                                                setUrl('');
                                                return setFieldValue('channel.configData.avatar', '');
                                            }

                                            const fileToUpload = fileList[fileList.length - 1];
                                            const maxSizeMB = 2;
                                            if (
                                                fileToUpload?.originFileObj &&
                                                fileToUpload?.originFileObj?.size > maxSizeMB * 1000000
                                            ) {
                                                alert(getTranslation('Select a file up to 2MB'));
                                                return;
                                            }

                                            if (fileToUpload?.originFileObj) {
                                                const encodedFile = await fileToBase64(
                                                    fileToUpload.originFileObj as File
                                                );
                                                
                                                setUrl(encodedFile.url);
                                                setFile(fileToUpload.originFileObj);
                                                setFieldValue('channel.configData.avatar', '');
                                            } else {
                                                return setFieldValue('channel.configData.avatar', '');
                                            }
                                        }}
                                    >
                                        <Button>
                                            <BiUpload /> Select File
                                        </Button>
                                    </Upload>
                                </LabelWrapper>
                            </Wrapper>
                            <Wrapper width='30%'>
                                <LabelWrapper label={getTranslation('Chat color')}>
                                    <InputColor
                                        name={`channel.configData.color`}
                                        value={channel.configData.color || ''}
                                        onChange={(color) => {
                                            setFieldValue(`channel.configData.color`, color);
                                        }}
                                    />
                                </LabelWrapper>
                            </Wrapper>
                        </Wrapper>

                        <Wrapper margin='15px 0' alignItems='center' flexBox>
                            <Toggle
                                checked={
                                    channel.configData.enableAnimation === undefined
                                        ? true
                                        : channel.configData.enableAnimation
                                }
                                onChange={() => {
                                    setFieldValue(
                                        `channel.configData.enableAnimation`,
                                        channel.configData.enableAnimation === undefined
                                            ? false
                                            : !channel.configData.enableAnimation
                                    );
                                }}
                            />
                            <Wrapper margin='0 0 0 15px'>{getTranslation('Enable animation on avatar image')}</Wrapper>
                        </Wrapper>

                        <Wrapper margin='15px 0 25px 0'>
                            <Wrapper alignItems='center' flexBox>
                                <Toggle
                                    checked={channel.configData.showTooltip}
                                    onChange={() => {
                                        setFieldValue(
                                            `channel.configData.showTooltip`,
                                            !channel.configData.showTooltip
                                        );
                                        if (!channel.configData.toolTipText?.length) {
                                            setFieldValue(`channel.configData.toolTipText`, [
                                                {
                                                    language: 'pt',
                                                    text: '',
                                                },
                                            ]);
                                        } else {
                                            setFieldValue(`channel.configData.toolTipText`, [
                                                {
                                                    language: 'pt',
                                                    text: channel.configData.toolTipText?.[0].text,
                                                },
                                            ]);
                                        }
                                    }}
                                />
                                <Wrapper margin='0 0 0 15px'>
                                    {getTranslation('Enable tooltip above the chat start button')}
                                </Wrapper>
                            </Wrapper>

                            {values.channel.configData.showTooltip && (
                                <Wrapper margin='13px 0'>
                                    <LabelWrapper label={getTranslation('Text that will be displayed in the tooltip')}>
                                        <InputSimple
                                            value={values.channel.configData.toolTipText[0].text}
                                            placeholder={getTranslation('Chat title')}
                                            maxLength={100}
                                            onChange={(event) =>
                                                setFieldValue(
                                                    'channel.configData.toolTipText[0].text',
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </LabelWrapper>
                                    <Wrapper width='30%'>
                                        <LabelWrapper label={getTranslation('Cor de fundo do tooltip')}>
                                            <InputColor
                                                name={`channel.configData.backgroundTooltip`}
                                                value={channel.configData.backgroundTooltip || ''}
                                                onChange={(color) => {
                                                    setFieldValue(`channel.configData.backgroundTooltip`, color);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Wrapper>
                                </Wrapper>
                            )}
                        </Wrapper>
                    </DivisorCard>
                )}

                {selectedMenu.sections[1].showOnChannelIdEquals.includes(channel.channelId) && (
                    <DivisorCard title={getTranslation('Behavior')}>
                        <Wrapper flexBox margin='0 0 15px 0'>
                            <Wrapper>
                                <Toggle
                                    checked={channel.configData.startChatOnLoad}
                                    onChange={() =>
                                        setFieldValue(
                                            `channel.configData.startChatOnLoad`,
                                            !channel.configData.startChatOnLoad
                                        )
                                    }
                                />
                            </Wrapper>
                            <Wrapper margin='0 0 0 10px'>
                                {getTranslation('Start chat as soon as the page loads')}
                            </Wrapper>
                        </Wrapper>
                        <Wrapper flexBox margin='0 0 15px 0'>
                            <Wrapper>
                                <Toggle
                                    checked={channel.configData.startWithConfirmation}
                                    onChange={() =>
                                        setFieldValue(
                                            `channel.configData.startWithConfirmation`,
                                            !channel.configData.startWithConfirmation
                                        )
                                    }
                                />
                            </Wrapper>
                            <Wrapper margin='0 0 0 10px'>
                                {getTranslation('Show action for the user to confirm whether to initiate a chat')}
                            </Wrapper>
                        </Wrapper>
                        <Wrapper flexBox margin='0 0 15px 0'>
                            <Wrapper>
                                <Toggle
                                    checked={channel.keepLive}
                                    onChange={() => setFieldValue(`channel.keepLive`, !channel.keepLive)}
                                />
                            </Wrapper>
                            <Wrapper margin='0 0 0 10px'>
                                {getTranslation("Load the user's last conversation if it can be restored")}
                            </Wrapper>
                        </Wrapper>
                        {channel.channelId === ChannelIdConfig.webchat && (
                            <Wrapper flexBox margin='0 0 15px 0'>
                                <Wrapper>
                                    <Toggle
                                        checked={channel.configData.embedded}
                                        onChange={() =>
                                            setFieldValue(`channel.configData.embedded`, !channel.configData.embedded)
                                        }
                                    />
                                </Wrapper>
                                <Wrapper margin='0 0 0 10px'>
                                    {getTranslation('Remove actions and style from the chat initiator')}
                                </Wrapper>
                            </Wrapper>
                        )}
                    </DivisorCard>
                )}
            </Wrapper>
        </Wrapper>
    );
};

export default I18n(TabAppearance);
