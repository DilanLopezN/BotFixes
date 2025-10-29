import { Alert, Button, Select, Space } from 'antd';
import { useFormik } from 'formik-latest';
import { FC, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ChannelConfig } from '../../../../model/Bot';
import { Team } from '../../../../model/Team';
import { PageTemplate } from '../../../../shared-v2/page-template';
import { InputSimple } from '../../../../shared/InputSample/InputSimple';
import { SimpleSelect } from '../../../../shared/SimpleSelect/SimpleSelect';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { TextAreaSimple } from '../../../../shared/TextAreaSimple/TextAreaSimple';
import Toggle from '../../../../shared/Toggle/Toggle';
import { Card, Wrapper } from '../../../../ui-kissbot-v2/common';
import { GetEnv } from '../../../../utils/GetEnv';
import { timeout } from '../../../../utils/Timer';
import I18n from '../../../i18n/components/i18n';
import { ChannelConfigService } from '../../../newChannelConfig/service/ChannelConfigService';
import { TeamService } from '../../../teams/services/TeamService';
import { SettingsService } from '../../service/SettingsService';
import { EnableRatingDetailsSwitch } from './components/enable-rating-details-switch';
import { RatingSettings } from './interface';
import { RatingProps } from './props';
import { ExampleRating } from './styled';
const { Option } = Select;

const Rating: FC<RatingProps> = (props) => {
    const { menuSelected, selectedWorkspace, getTranslation, addNotification } = props;
    const [rating, setRating] = useState<RatingSettings>({
        ratingText: '',
        feedbackText: '',
        linkText: '',
        disableLinkAfterRating: false,
        expiresIn: 0,
    });
    const [expiresIn, setExpiresIn] = useState({ number: 1, time: 0 });
    const [showTeams, setShowTeams] = useState<boolean>(false);
    const [showChannels, setShowChannels] = useState<boolean>(false);
    const [workspaceTeams, setWorkspaceTeams] = useState<Team[]>([]);
    const [workspaceChannels, setWorkspaceChannels] = useState<ChannelConfig[]>([]);
    const [featureFlag, setFeatureFlag] = useState(selectedWorkspace?.generalConfigs?.enableRating);

    useEffect(() => {
        if (selectedWorkspace) {
            GetEnv('rating_url');
            getRatingWorkspace();
            getWorkspaceTeams();
            getWorkspaceChannels();
        }
    }, [selectedWorkspace]);

    useEffect(() => {
        setFeatureFlag(selectedWorkspace?.generalConfigs?.enableRating);
    }, [selectedWorkspace?.generalConfigs?.enableRating]);

    const getRatingWorkspace = async () => {
        const response = await SettingsService.getRatingSettings(selectedWorkspace._id);

        if (!response) return;
        getExpiresIn(response.expiresIn);
        formik.setValues(response);
        setRating({
            ...response,
            linkText: response.linkText || 'Avalie seu atendimento no link abaixo',
            ratingText: response.ratingText || 'Como foi seu atendimento conosco?',
            feedbackText: response.feedbackText || 'Deixe uma mensagem para nós:',
        });
        setShowTeams(!!response.teamCriteria?.length);
        setShowChannels(!!response.channelCriteria?.length);
    };

    const getWorkspaceTeams = async () => {
        const response = await TeamService.getTeams(selectedWorkspace._id);
        if (response?.data?.length) {
            setWorkspaceTeams(response.data);
        }
    };

    const getWorkspaceChannels = async () => {
        const data = await ChannelConfigService.getChannelsConfig({
            workspaceId: selectedWorkspace._id,
            enable: true,
        });

        if (data?.length) {
            setWorkspaceChannels(data);
        }
    };

    const getExpiresIn = (value) => {
        let i = 1;

        if (value === null) return;

        if (value % 86400 === 0) {
            while (i * 86400 < value) {
                i++;
            }
            setExpiresIn({ number: i, time: 86400 });
        } else if (value % 3600 === 0) {
            while (i * 3600 < value) {
                i++;
            }
            setExpiresIn({ number: i, time: 3600 });
        } else if (value % 60 === 0) {
            while (i * 60 < value) {
                i++;
            }
            setExpiresIn({ number: i, time: 60 });
        } else {
            return setExpiresIn({ number: 1, time: 0 });
        }
    };

    const createRating = async (ratingForm: RatingSettings) => {
        if (!ratingForm) {
            return;
        }
        let error: any;

        await SettingsService.createRating(selectedWorkspace._id, ratingForm, (err: any) => {
            error = err;
        });

        if (!error) {
            return addNotification({
                title: getTranslation('Success'),
                message: getTranslation('Saved successfully'),
                type: 'success',
                duration: 3000,
            });
        }
        return addNotification({
            title: getTranslation('Error'),
            message: getTranslation('Error. Try again'),
            type: 'warning',
            duration: 3000,
        });
    };

    const updateRating = async (ratingForm: RatingSettings) => {
        if (!ratingForm) {
            return;
        }
        let error: any;

        await SettingsService.updateRatingSettings(selectedWorkspace._id, ratingForm, (err: any) => {
            error = err;
        });

        if (!error) {
            return addNotification({
                title: getTranslation('Success'),
                message: getTranslation('Saved successfully'),
                type: 'success',
                duration: 3000,
            });
        }
        return addNotification({
            title: getTranslation('Error'),
            message: getTranslation('Error. Try again'),
            type: 'warning',
            duration: 3000,
        });
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: { ...rating },
        onSubmit: () => {
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    const newValue = { ...formik.values, expiresIn: calcExpires() };

                    if (rating && rating.id) {
                        return updateRating({ ...newValue, id: rating.id });
                    }
                    createRating(newValue);
                }
            });
        },
    });

    const calcExpires = () => {
        if (expiresIn.time === 0) {
            return null;
        }
        return expiresIn.number * expiresIn.time;
    };

    const handleActive = (isActive: boolean) => {
        setFeatureFlag(isActive);
    };
    useEffect(() => {
        mirrorResult();
    }, [formik.values]);

    const mirrorResult = () => {
        const iframe: any = document.getElementById('ratingExample');

        iframe.contentWindow.postMessage(
            {
                type: 'event',
                eventType: 'changed_text',
                data: {
                    ratingText: formik.values.ratingText || getTranslation('How was your service with us?'),
                    feedbackText: formik.values.feedbackText || getTranslation('Leave a message for us:'),
                },
            },
            '*'
        );
    };
    const pageTitle = (
        <Space align='center'>
            <span>{menuSelected.title}</span>

            <EnableRatingDetailsSwitch onActive={handleActive} />
            {!featureFlag && <Alert message={'A funcionalidade está inativa'} />}
        </Space>
    );

    return (
        <PageTemplate
            title={pageTitle}
            actionButtons={
                <Button onClick={formik.submitForm} className='antd-span-default-color' type='primary'>
                    {getTranslation('Save')}
                </Button>
            }
        >
            <Wrapper margin='0 auto' maxWidth='1100px' minWidth='800px' padding={'20px 30px'}>
                {selectedWorkspace && (
                    <>
                        <Wrapper margin='45px 0 0 0' flexBox width='100%'>
                            <Wrapper width='100%'>
                                <Card
                                    flexDirection='row'
                                    styleHeader={{
                                        height: '45px',
                                        bgColor: '#f2f2f2',
                                        padding: '10px',
                                        color: '#555',
                                        fontSize: 'large',
                                        fontWeight: 'normal',
                                        textTransform: 'normal',
                                    }}
                                    header={getTranslation('Rating settings')}
                                >
                                    <form style={{ width: 'inherit' }}>
                                        <Wrapper>
                                            <LabelWrapper
                                                tooltip={getTranslation(
                                                    'Message that will be sent along with the evaluation link for the patient at the end of the service'
                                                )}
                                                validate={{
                                                    touched: formik.touched,
                                                    errors: formik.errors,
                                                    isSubmitted: formik.isSubmitting,
                                                    fieldName: `linkText`,
                                                }}
                                                label={getTranslation('Link message')}
                                            >
                                                <TextAreaSimple
                                                    maxLength={150}
                                                    style={{ height: '100px', resize: 'none' }}
                                                    value={formik.values.linkText}
                                                    placeholder={getTranslation('Rate your service on the link below')}
                                                    onChange={(event) => {
                                                        formik.setFieldValue('linkText', event.target.value);
                                                    }}
                                                />
                                            </LabelWrapper>

                                            <LabelWrapper
                                                tooltip={getTranslation(
                                                    'Fill in a message that motivates the patient to rate the service'
                                                )}
                                                validate={{
                                                    touched: formik.touched,
                                                    errors: formik.errors,
                                                    isSubmitted: formik.isSubmitting,
                                                    fieldName: `ratingText`,
                                                }}
                                                label={getTranslation('Message')}
                                            >
                                                <TextAreaSimple
                                                    autoFocus
                                                    maxLength={150}
                                                    style={{ height: '100px', resize: 'none' }}
                                                    value={formik.values.ratingText}
                                                    placeholder={getTranslation('How was your service with us?')}
                                                    onChange={(event) => {
                                                        formik.setFieldValue('ratingText', event.target.value);
                                                    }}
                                                />
                                            </LabelWrapper>

                                            <LabelWrapper
                                                tooltip={getTranslation(
                                                    'Fill in with a message that motivates the patient to give feedback on the service'
                                                )}
                                                validate={{
                                                    touched: formik.touched,
                                                    errors: formik.errors,
                                                    isSubmitted: formik.isSubmitting,
                                                    fieldName: `feedbackText`,
                                                }}
                                                label={getTranslation('Feedback')}
                                            >
                                                <TextAreaSimple
                                                    maxLength={150}
                                                    style={{ height: '100px', resize: 'none' }}
                                                    value={formik.values.feedbackText}
                                                    placeholder={getTranslation('Leave a message for us:')}
                                                    onChange={(event) => {
                                                        formik.setFieldValue('feedbackText', event.target.value);
                                                    }}
                                                />
                                            </LabelWrapper>

                                            <Wrapper margin='15px 35px 0 35px' borderBottom='1px #ddd solid' />
                                            <Wrapper margin='10px 0 15px 0'>
                                                {getTranslation('Configuração pós avaliação')}
                                            </Wrapper>

                                            <LabelWrapper
                                                tooltip={getTranslation(
                                                    'Mensagem a ser exibida na tela de agradecimento após o paciente avaliar o atendimento'
                                                )}
                                                validate={{
                                                    touched: formik.touched,
                                                    errors: formik.errors,
                                                    isSubmitted: formik.isSubmitting,
                                                    fieldName: `messageAfterRating`,
                                                }}
                                                label={getTranslation('Mensagem pós avaliação')}
                                            >
                                                <Wrapper>
                                                    <TextAreaSimple
                                                        maxLength={150}
                                                        style={{ height: '100px', resize: 'none' }}
                                                        value={formik.values.messageAfterRating}
                                                        placeholder={getTranslation(
                                                            'Rate your service on the link below'
                                                        )}
                                                        onChange={(event) => {
                                                            formik.setFieldValue(
                                                                'messageAfterRating',
                                                                event.target.value
                                                            );
                                                        }}
                                                    />
                                                </Wrapper>
                                            </LabelWrapper>

                                            <LabelWrapper
                                                tooltip={getTranslation(
                                                    'Botão com ação a ser exibido na tela de agradecimento após o paciente avaliar o atendimento'
                                                )}
                                                validate={{
                                                    touched: formik.touched,
                                                    errors: formik.errors,
                                                    isSubmitted: formik.isSubmitting,
                                                    fieldName: `ctaButtonText`,
                                                }}
                                                label={getTranslation('Botão de ação pós avaliação')}
                                            >
                                                <Wrapper display='flex'>
                                                    <Wrapper width='30%'>
                                                        <InputSimple
                                                            maxLength={50}
                                                            value={formik.values.ctaButtonText}
                                                            placeholder={getTranslation('Texto do botão')}
                                                            onChange={(event) => {
                                                                formik.setFieldValue(
                                                                    'ctaButtonText',
                                                                    event.target.value
                                                                );
                                                            }}
                                                        />
                                                    </Wrapper>
                                                    <Wrapper width='70%'>
                                                        <InputSimple
                                                            maxLength={250}
                                                            style={{ marginLeft: `10px` }}
                                                            value={formik.values.ctaButtonUrl}
                                                            placeholder={getTranslation('Link do botão')}
                                                            onChange={(event) => {
                                                                formik.setFieldValue(
                                                                    'ctaButtonUrl',
                                                                    event.target.value
                                                                );
                                                            }}
                                                        />
                                                    </Wrapper>
                                                </Wrapper>
                                            </LabelWrapper>

                                            <Wrapper margin='15px 35px 0 35px' borderBottom='1px #ddd solid' />
                                            <Wrapper margin='10px 0 15px 0'>
                                                {getTranslation('Usability Settings')}
                                            </Wrapper>

                                            <LabelWrapper
                                                tooltip={getTranslation(
                                                    'Time for the link to be deactivated, and the patient can no longer rate the service'
                                                )}
                                                validate={{
                                                    touched: formik.touched,
                                                    errors: formik.errors,
                                                    isSubmitted: formik.isSubmitting,
                                                    fieldName: `expiresIn`,
                                                }}
                                                label={getTranslation('Link expiry time')}
                                            >
                                                <Wrapper flexBox width='300px'>
                                                    <InputSimple
                                                        value={expiresIn.number}
                                                        type='number'
                                                        min={1}
                                                        max={100}
                                                        style={{ width: '100px' }}
                                                        onChange={(event) => {
                                                            const value = parseInt(event.target.value);
                                                            if (value > 0 && value < 101) {
                                                                setExpiresIn({ ...expiresIn, number: value });
                                                            }
                                                        }}
                                                    />
                                                    <SimpleSelect
                                                        value={expiresIn.time}
                                                        onChange={(event) => {
                                                            const value = parseInt(event.target.value);
                                                            setExpiresIn({ ...expiresIn, time: value });
                                                        }}
                                                    >
                                                        <option value={0}>{getTranslation('do not expire')}</option>
                                                        <option value={60}>{getTranslation('Minutes')}</option>
                                                        <option value={3600}>{getTranslation('Hours')}</option>
                                                        <option value={86400}>{getTranslation('Days')}</option>
                                                    </SimpleSelect>
                                                </Wrapper>
                                            </LabelWrapper>

                                            <LabelWrapper
                                                validate={{
                                                    touched: formik.touched,
                                                    errors: formik.errors,
                                                    isSubmitted: formik.isSubmitting,
                                                    fieldName: `disableLinkAfterRating`,
                                                }}
                                            >
                                                <Toggle
                                                    checked={formik.values.disableLinkAfterRating}
                                                    label={getTranslation('Disable link after review')}
                                                    tooltip={getTranslation(
                                                        'Disable the link after the rating, the patient will not be able to change the grade after having performed an assessment'
                                                    )}
                                                    onChange={() =>
                                                        formik.setFieldValue(
                                                            'disableLinkAfterRating',
                                                            !formik.values.disableLinkAfterRating
                                                        )
                                                    }
                                                />
                                            </LabelWrapper>

                                            <Wrapper margin='15px 35px 0 35px' borderBottom='1px #ddd solid' />

                                            <LabelWrapper>
                                                <Toggle
                                                    checked={!showTeams}
                                                    label={getTranslation(
                                                        'Send evaluation for all calls from any team'
                                                    )}
                                                    tooltip={getTranslation(
                                                        'You can send evaluation at the end of the service for all teams or select the teams that will be sent'
                                                    )}
                                                    onChange={() => {
                                                        setShowTeams(!showTeams);
                                                        formik.setFieldValue('teamCriteria', []);
                                                    }}
                                                />
                                            </LabelWrapper>

                                            {showTeams && (
                                                <LabelWrapper label={`${getTranslation('Teams')}:`}>
                                                    <Select
                                                        style={{ width: '100%' }}
                                                        mode={'multiple'}
                                                        placeholder={getTranslation('Teams')}
                                                        allowClear
                                                        value={formik.values.teamCriteria}
                                                        onChange={(value) => {
                                                            formik.setFieldValue(`teamCriteria`, value);
                                                        }}
                                                    >
                                                        {workspaceTeams.map((team) => {
                                                            return <Option value={team._id}>{team.name}</Option>;
                                                        })}
                                                    </Select>
                                                </LabelWrapper>
                                            )}
                                            <LabelWrapper>
                                                <Toggle
                                                    checked={!showChannels}
                                                    label={getTranslation('Send rating for all calls from any channel')}
                                                    tooltip={getTranslation(
                                                        'You can send evaluation at the end of the service for all channels or select the channels that will be sent'
                                                    )}
                                                    onChange={() => {
                                                        setShowChannels(!showChannels);
                                                        formik.setFieldValue('channelCriteria', []);
                                                    }}
                                                />
                                            </LabelWrapper>

                                            {showChannels && (
                                                <LabelWrapper label={`${getTranslation('Channels')}:`}>
                                                    <Select
                                                        style={{ width: '100%', paddingBottom: '15px' }}
                                                        mode={'multiple'}
                                                        placeholder={getTranslation('Channels')}
                                                        allowClear
                                                        value={formik.values.channelCriteria}
                                                        onChange={(value) => {
                                                            formik.setFieldValue(`channelCriteria`, value);
                                                        }}
                                                    >
                                                        {workspaceChannels.map((channel) => {
                                                            return <Option value={channel._id}>{channel.name}</Option>;
                                                        })}
                                                    </Select>
                                                </LabelWrapper>
                                            )}
                                        </Wrapper>
                                    </form>
                                </Card>
                            </Wrapper>
                            {rating ? (
                                <ExampleRating>
                                    <iframe
                                        title='Rating Example'
                                        onLoad={() =>
                                            timeout(() => {
                                                mirrorResult();
                                            }, 100)
                                        }
                                        src={GetEnv('rating_url')}
                                        width={'100%'}
                                        height={'100%'}
                                        style={{
                                            borderRadius: '10px',
                                            border: 'none',
                                        }}
                                        id={'ratingExample'}
                                    ></iframe>
                                </ExampleRating>
                            ) : null}
                        </Wrapper>
                    </>
                )}
            </Wrapper>
        </PageTemplate>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default I18n(withRouter(connect(mapStateToProps, null)(Rating)));
