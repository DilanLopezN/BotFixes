import { FC, useEffect, useState } from 'react';
import { FlowRulesConfirmationCardProps } from './props';
import { Card, Wrapper } from '../../../../../../../../../../ui-kissbot-v2/common';
import { LabelWrapper } from '../../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import I18n from '../../../../../../../../../i18n/components/i18n';
import MenuLeftActions from '../MenuLeftActions';
import { InputSimple } from '../../../../../../../../../../shared/InputSample/InputSimple';
import { Row, Col, Select, Divider, Input } from 'antd';
import { BotService } from '../../../../../../../../../bot/services/BotService';
import Toggle from '../../../../../../../../../../shared/Toggle/Toggle';
import { CancelReasonDto } from '../../../../../../../../../campaigns/interfaces/cancel-reason';
import { CancelReasonService } from '../../../../../../../../../campaigns/service/CancelReasonService';

const FlowRulesConfirmationCard: FC<FlowRulesConfirmationCardProps> = ({
    touched,
    errors,
    isSubmitted,
    setFieldValue,
    getTranslation,
    values,
    index,
    onDeleteAction,
    workspaceId,
    bots,
}) => {
    const actionsRulesConfirmation: any[] = values;
    const [botId, setBotId] = useState<string | undefined>(undefined);
    const [interactions, setInteractions] = useState<any[]>([]);
    const [cancelReasonList, setCancelReasonList] = useState<CancelReasonDto[]>([]);

    useEffect(() => {
        if (actionsRulesConfirmation[index].element?.confirmationGoto) {
            const string = actionsRulesConfirmation[index].element?.confirmationGoto?.split(':');
            setBotId(string[0] || bots[0]?._id);
            getInteractions(workspaceId, string[0] || bots[0]?._id);
        } else if (bots.length > 0) {
            setBotId(bots[0]?._id);
            getInteractions(workspaceId, bots[0]?._id);
        }
    }, [bots]);

    useEffect(() => {
        getCancelReasonList();
    }, []);

    const getInteractions = async (workspaceId: string, botId: string) => {
        const interactionsList = await BotService.getInteractions(workspaceId, botId);
        setInteractions(interactionsList?.data || []);
    };

    const getCancelReasonList = async () => {
        const reasonList = await CancelReasonService.getCancelReasonList(workspaceId);
        setCancelReasonList(reasonList || []);
    };

    const redefineFields = () => {
        setFieldValue(`actions[${index}].element.confirmationGoto`, undefined);
        setFieldValue(`actions[${index}].element.cancelGoto`, undefined);
        setFieldValue(`actions[${index}].element.rescheduleGoto`, undefined);
        setFieldValue(`actions[${index}].element.onErrorGoto`, undefined);
        setFieldValue(`actions[${index}].element.notActionGoto`, undefined);
    };

    return (
        <Wrapper margin='0 0 -50px 0'>
            <Wrapper fontSize='16px' margin='10px 45px -60px' width='90%'>
                {getTranslation('Regras confirmação')}
            </Wrapper>
            <MenuLeftActions
                values={values}
                index={index}
                onchange={(actions) => setFieldValue(`actions`, actions)}
                onDeleteAction={onDeleteAction}
            />
            <Wrapper
                position='relative'
                top='-65px'
                margin='15px 20px 15px 45px'
                width='90%'
                padding='15px'
                borderRadius='5px'
                border='1px #e2e2e2 solid'
                bgcolor='#f7f7f7'
                borderBottom='1px #ddd solid'
            >
                <Card header={getTranslation('General')} margin='0 0 10px 0'>
                    <LabelWrapper
                        label={getTranslation('Go to interaction if any error occurs')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'onErrorGoto',
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    value={botId}
                                    placeholder={getTranslation('Choose a bot')}
                                    onChange={(value) => {
                                        if (!!value) {
                                            redefineFields();

                                            getInteractions(workspaceId, value);
                                            setBotId(value);
                                        } else {
                                            setBotId('');
                                            setInteractions([]);
                                        }
                                    }}
                                    options={bots.map((bot) => ({ label: bot.name, value: bot._id }))}
                                />
                            </Col>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    showSearch
                                    placeholder={getTranslation('Choose an interaction')}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    value={actionsRulesConfirmation[index].element?.onErrorGoto?.split(':')[1]}
                                    allowClear
                                    onChange={(value) => {
                                        if (!!value) {
                                            setFieldValue(`actions[${index}].element.onErrorGoto`, `${botId}:${value}`);
                                        } else {
                                            setFieldValue(`actions[${index}].element.onErrorGoto`, undefined);
                                        }
                                    }}
                                    options={interactions.map((interaction) => ({
                                        label: interaction.name,
                                        value: interaction._id,
                                    }))}
                                />
                            </Col>
                        </Row>
                    </LabelWrapper>
                    <LabelWrapper
                        label={getTranslation('rulesConfirmationNotActionGoto')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'notActionGoto',
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    value={botId}
                                    placeholder={getTranslation('Choose a bot')}
                                    onChange={(value) => {
                                        if (!!value) {
                                            redefineFields();

                                            getInteractions(workspaceId, value);
                                            setBotId(value);
                                        } else {
                                            setBotId('');
                                            setInteractions([]);
                                        }
                                    }}
                                    options={bots.map((bot) => ({ label: bot.name, value: bot._id }))}
                                />
                            </Col>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    showSearch
                                    placeholder={getTranslation('Choose an interaction')}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    value={actionsRulesConfirmation[index].element?.notActionGoto?.split(':')[1]}
                                    allowClear
                                    onChange={(value) => {
                                        if (!!value) {
                                            setFieldValue(
                                                `actions[${index}].element.notActionGoto`,
                                                `${botId}:${value}`
                                            );
                                        } else {
                                            setFieldValue(`actions[${index}].element.notActionGoto`, undefined);
                                        }
                                    }}
                                    options={interactions.map((interaction) => ({
                                        label: interaction.name,
                                        value: interaction._id,
                                    }))}
                                />
                            </Col>
                        </Row>
                    </LabelWrapper>
                    <Row gutter={16}>
                        <Col span={8}>
                            <LabelWrapper
                                label={getTranslation('Priority')}
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: isSubmitted,
                                    fieldName: 'priority',
                                }}
                            >
                                <InputSimple
                                    type={'number'}
                                    value={actionsRulesConfirmation[index].element?.priority}
                                    onChange={(event) => {
                                        setFieldValue(
                                            `actions[${index}].element.priority`,
                                            Number(event.target.value) || null
                                        );
                                    }}
                                />
                            </LabelWrapper>
                        </Col>
                    </Row>
                </Card>

                <Card header={getTranslation('Confirmation')} margin='0 0 10px 0'>
                    <LabelWrapper
                        label={getTranslation('rulesConfirmationConfirmationGoto')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'confirmationGoto',
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    value={botId}
                                    placeholder={getTranslation('Choose a bot')}
                                    onChange={(value) => {
                                        if (!!value) {
                                            redefineFields();

                                            getInteractions(workspaceId, value);
                                            setBotId(value);
                                        } else {
                                            setBotId('');
                                            setInteractions([]);
                                        }
                                    }}
                                    options={bots.map((bot) => ({ label: bot.name, value: bot._id }))}
                                />
                            </Col>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    showSearch
                                    placeholder={getTranslation('Choose an interaction')}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    value={actionsRulesConfirmation[index].element?.confirmationGoto?.split(':')[1]}
                                    allowClear
                                    onChange={(value) => {
                                        if (!!value) {
                                            setFieldValue(
                                                `actions[${index}].element.confirmationGoto`,
                                                `${botId}:${value}`
                                            );
                                        } else {
                                            setFieldValue(`actions[${index}].element.confirmationGoto`, undefined);
                                        }
                                    }}
                                    options={interactions.map((interaction) => ({
                                        label: interaction.name,
                                        value: interaction._id,
                                    }))}
                                />
                            </Col>
                        </Row>
                    </LabelWrapper>
                    <LabelWrapper
                        label={getTranslation('rulesConfirmationConfirmationMessage')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'confirmationMessage',
                        }}
                    >
                        <Input.TextArea
                            autoSize={{ minRows: 3, maxRows: 30 }}
                            value={actionsRulesConfirmation[index].element.confirmationMessage}
                            onChange={(value) => {
                                setFieldValue(`actions[${index}].element.confirmationMessage`, value.target.value);
                            }}
                        />
                    </LabelWrapper>
                    <LabelWrapper
                        label={getTranslation('rulesConfirmatioSendGuidanceOnConfirmSchedule')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'sendGuidanceOnConfirmSchedule',
                        }}
                    >
                        <Toggle
                            checked={actionsRulesConfirmation[index].element?.sendGuidanceOnConfirmSchedule}
                            onChange={() => {
                                setFieldValue(
                                    `actions[${index}].element.sendGuidanceOnConfirmSchedule`,
                                    !actionsRulesConfirmation[index].element.sendGuidanceOnConfirmSchedule
                                );
                            }}
                        />
                    </LabelWrapper>
                </Card>

                <Card header={getTranslation('Cancelamento')} margin='0 0 10px 0'>
                    <LabelWrapper
                        label={getTranslation('rulesConfirmationCancelGoto')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'cancelGoto',
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    value={botId}
                                    placeholder={getTranslation('Choose a bot')}
                                    onChange={(value) => {
                                        if (!!value) {
                                            redefineFields();

                                            getInteractions(workspaceId, value);
                                            setBotId(value);
                                        } else {
                                            setBotId('');
                                            setInteractions([]);
                                        }
                                    }}
                                    options={bots.map((bot) => ({ label: bot.name, value: bot._id }))}
                                />
                            </Col>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    showSearch
                                    placeholder={getTranslation('Choose an interaction')}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    value={actionsRulesConfirmation[index].element?.cancelGoto?.split(':')[1]}
                                    allowClear
                                    onChange={(value) => {
                                        if (!!value) {
                                            setFieldValue(`actions[${index}].element.cancelGoto`, `${botId}:${value}`);
                                        } else {
                                            setFieldValue(`actions[${index}].element.cancelGoto`, undefined);
                                        }
                                    }}
                                    options={interactions.map((interaction) => ({
                                        label: interaction.name,
                                        value: interaction._id,
                                    }))}
                                />
                            </Col>
                        </Row>
                    </LabelWrapper>
                    <LabelWrapper
                        label={getTranslation('rulesConfirmationCancelMessage')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'cancelMessage',
                        }}
                    >
                        <Input.TextArea
                            autoSize={{ minRows: 3, maxRows: 30 }}
                            value={actionsRulesConfirmation[index].element.cancelMessage}
                            onChange={(value) => {
                                setFieldValue(`actions[${index}].element.cancelMessage`, value.target.value);
                            }}
                        />
                    </LabelWrapper>
                    <LabelWrapper
                        label={getTranslation('rulesConfirmationCancelWithGoto')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'cancelWithGoto',
                        }}
                    >
                        <Toggle
                            checked={actionsRulesConfirmation[index].element?.cancelWithGoto}
                            onChange={() => {
                                setFieldValue(
                                    `actions[${index}].element.cancelWithGoto`,
                                    !actionsRulesConfirmation[index].element.cancelWithGoto
                                );
                            }}
                        />
                    </LabelWrapper>
                    <LabelWrapper
                        label={getTranslation('rulesConfirmationCancelReasonList')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'cancelReasonList',
                        }}
                    >
                        <Select
                            style={{ width: '100%' }}
                            size='large'
                            showSearch
                            mode='tags'
                            placeholder={getTranslation('Selecione os motivos de cancelamento')}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            value={actionsRulesConfirmation[index].element?.cancelReasonList}
                            allowClear
                            onChange={(value) => {
                                if (!!value) {
                                    setFieldValue(`actions[${index}].element.cancelReasonList`, value);
                                } else {
                                    setFieldValue(`actions[${index}].element.cancelReasonList`, undefined);
                                }
                            }}
                            options={cancelReasonList.map((reason) => ({
                                label: reason.reasonName,
                                value: reason.id,
                            }))}
                        />
                    </LabelWrapper>
                </Card>

                <Card header={getTranslation('Rescheduling')} margin='0 0 10px 0'>
                    <LabelWrapper
                        label={getTranslation('rulesConfirmationRescheduleGoto')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'rescheduleGoto',
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    value={botId}
                                    placeholder={getTranslation('Choose a bot')}
                                    onChange={(value) => {
                                        if (!!value) {
                                            redefineFields();

                                            getInteractions(workspaceId, value);
                                            setBotId(value);
                                        } else {
                                            setBotId('');
                                            setInteractions([]);
                                        }
                                    }}
                                    options={bots.map((bot) => ({ label: bot.name, value: bot._id }))}
                                />
                            </Col>
                            <Col span={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    size='large'
                                    showSearch
                                    placeholder={getTranslation('Choose an interaction')}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    value={actionsRulesConfirmation[index].element?.rescheduleGoto?.split(':')[1]}
                                    allowClear
                                    onChange={(value) => {
                                        if (!!value) {
                                            setFieldValue(
                                                `actions[${index}].element.rescheduleGoto`,
                                                `${botId}:${value}`
                                            );
                                        } else {
                                            setFieldValue(`actions[${index}].element.rescheduleGoto`, undefined);
                                        }
                                    }}
                                    options={interactions.map((interaction) => ({
                                        label: interaction.name,
                                        value: interaction._id,
                                    }))}
                                />
                            </Col>
                        </Row>
                    </LabelWrapper>
                    <Row gutter={16}>
                        <Col span={10}>
                            <LabelWrapper
                                label={getTranslation('Ask if you want to reschedule')}
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: isSubmitted,
                                    fieldName: 'askReschedule',
                                }}
                            >
                                <Toggle
                                    checked={actionsRulesConfirmation[index].element?.askReschedule}
                                    onChange={() => {
                                        setFieldValue(
                                            `actions[${index}].element.askReschedule`,
                                            !actionsRulesConfirmation[index].element.askReschedule
                                        );
                                    }}
                                />
                            </LabelWrapper>
                        </Col>
                        <Col span={12}>
                            <LabelWrapper
                                label={getTranslation('Automatically reschedule')}
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: isSubmitted,
                                    fieldName: 'automaticallyReschedule',
                                }}
                            >
                                <Toggle
                                    checked={actionsRulesConfirmation[index].element?.automaticallyReschedule}
                                    onChange={() => {
                                        setFieldValue(
                                            `actions[${index}].element.automaticallyReschedule`,
                                            !actionsRulesConfirmation[index].element.automaticallyReschedule
                                        );
                                    }}
                                />
                            </LabelWrapper>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={16}>
                            <LabelWrapper
                                label={getTranslation('Cancel previous appointment after rescheduling')}
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: isSubmitted,
                                    fieldName: 'cancelOnReschedule',
                                }}
                            >
                                <Toggle
                                    checked={actionsRulesConfirmation[index].element?.cancelOnReschedule}
                                    onChange={() => {
                                        setFieldValue(
                                            `actions[${index}].element.cancelOnReschedule`,
                                            !actionsRulesConfirmation[index].element.cancelOnReschedule
                                        );
                                    }}
                                />
                            </LabelWrapper>
                        </Col>
                    </Row>
                </Card>

                <Card header={getTranslation('Orientação')}>
                    <LabelWrapper
                        label={getTranslation('Enviar orientação:')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'guidance',
                        }}
                    >
                        <Input.TextArea
                            autoSize={{ minRows: 3, maxRows: 30 }}
                            value={actionsRulesConfirmation[index].element.guidance}
                            onChange={(value) => {
                                setFieldValue(`actions[${index}].element.guidance`, value.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Card>
            </Wrapper>
        </Wrapper>
    );
};

export default I18n(FlowRulesConfirmationCard);
