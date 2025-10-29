import { Col, Row, Select } from 'antd';
import { AppointmentSortTypes } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { LabelWithTooltip } from '../../../../../../../../../../shared-v2/LabelWithToltip';
import { InputSimple } from '../../../../../../../../../../shared/InputSample/InputSimple';
import { LabelWrapper } from '../../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { TextAreaSimple } from '../../../../../../../../../../shared/TextAreaSimple/TextAreaSimple';
import Toggle from '../../../../../../../../../../shared/Toggle/Toggle';
import { Wrapper } from '../../../../../../../../../../ui-kissbot-v2/common';
import { isAnySystemAdmin } from '../../../../../../../../../../utils/UserPermission';
import { BotService } from '../../../../../../../../../bot/services/BotService';
import I18n from '../../../../../../../../../i18n/components/i18n';
import MenuLeftActions from '../MenuLeftActions';
import { FlowRulesCardProps } from './props';

const FlowRulesCardForm: FC<FlowRulesCardProps> = ({
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
    loggedUser,
}) => {
    const actionsRules: any[] = values;
    const [botId, setBotId] = useState<string | undefined>(undefined);
    const [interactions, setInteractions] = useState<any[]>([]);
    const isAnyAdmin = isAnySystemAdmin(loggedUser);
    useEffect(() => {
        if (actionsRules[index].element?.ifEmptyDataGoto) {
            const string = actionsRules[index].element?.ifEmptyDataGoto?.split(':');
            setBotId(string[0] || bots[0]?._id);
            getInteractions(workspaceId, string[0] || bots[0]?._id);
        } else if (bots.length > 0) {
            setBotId(bots[0]?._id);
            getInteractions(workspaceId, bots[0]?._id);
        }
    }, [bots]);

    const getInteractions = async (workspaceId: string, botId: string) => {
        const interactionsList = await BotService.getInteractions(workspaceId, botId);
        setInteractions(interactionsList?.data || []);
    };

    return (
        <Wrapper margin='0 0 -50px 0'>
            <Wrapper fontSize='16px' margin='10px 45px -60px' width='90%'>
                {getTranslation('Rules')}
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
                <LabelWrapper
                    label={
                        <LabelWithTooltip
                            color='default'
                            label={getTranslation('RulesAddress')}
                            tooltipText={getTranslation(
                                'Address that will be presented to the patient when confirming the selected time'
                            )}
                        />
                    }
                    validate={{
                        touched,
                        errors,
                        isSubmitted: isSubmitted,
                        fieldName: 'address',
                    }}
                >
                    <TextAreaSimple
                        value={actionsRules[index].element?.address}
                        onChange={(event) => {
                            setFieldValue(`actions[${index}].element.address`, event.target.value);
                        }}
                        style={{ minHeight: 70 }}
                    />
                </LabelWrapper>
                <Row gutter={16}>
                    <Col span={12}>
                        <LabelWrapper
                            label={
                                <LabelWithTooltip
                                    color='default'
                                    label={getTranslation('RulesPrice')}
                                    tooltipText={getTranslation(
                                        'Value that will be presented to the patient when confirming the selected time'
                                    )}
                                />
                            }
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'price',
                            }}
                        >
                            <InputSimple
                                value={actionsRules[index].element?.price}
                                onChange={(event) => {
                                    setFieldValue(`actions[${index}].element.price`, event.target.value);
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={12}>
                        <LabelWrapper
                            label={getTranslation('RulesLimit')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'limit',
                            }}
                        >
                            <InputSimple
                                type={'number'}
                                max={isAnyAdmin ? 250 : 50}
                                min={1}
                                value={actionsRules[index].element?.limit}
                                onChange={(event) => {
                                    const inputValue = event.target.value;

                                    if (
                                        (Number(inputValue) >= 1 && Number(inputValue) <= (isAnyAdmin ? 250 : 50)) ||
                                        inputValue === ''
                                    ) {
                                        setFieldValue(
                                            `actions[${index}].element.limit`,
                                            inputValue === '' ? null : Number(inputValue)
                                        );
                                    }
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <LabelWrapper
                            label={
                                <LabelWithTooltip
                                    color='default'
                                    label={getTranslation('Number of days to search')}
                                    tooltipText={getTranslation(
                                        'Number of days that will be sought to present schedules to the patient'
                                    )}
                                />
                            }
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'untilDay',
                            }}
                        >
                            <InputSimple
                                type={'number'}
                                max={1000}
                                min={0}
                                value={actionsRules[index].element?.untilDay}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    if ((Number(value) >= 0 && Number(value) <= 1000) || value === '') {
                                        setFieldValue(
                                            `actions[${index}].element.untilDay`,
                                            value === '' ? null : Number(value)
                                        );
                                    }
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={12}>
                        <LabelWrapper
                            label={getTranslation('RulesSortMethod')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'sortMethod',
                            }}
                        >
                            <Select
                                style={{ width: '100%' }}
                                size='large'
                                allowClear
                                value={actionsRules[index].element?.sortMethod}
                                placeholder={getTranslation('Select option')}
                                onChange={(value) => {
                                    setFieldValue(`actions[${index}].element.sortMethod`, value);
                                }}
                                options={[
                                    {
                                        label: getTranslation('default'),
                                        value: AppointmentSortTypes.default,
                                    },
                                    {
                                        label: getTranslation('firstEachPeriodDay'),
                                        value: AppointmentSortTypes.firstEachPeriodDay,
                                    },
                                    {
                                        label: getTranslation('firstEachHourDay'),
                                        value: AppointmentSortTypes.firstEachHourDay,
                                    },
                                    {
                                        label: getTranslation('firstEachAnyPeriodDay'),
                                        value: AppointmentSortTypes.firstEachAnyPeriodDay,
                                    },
                                    {
                                        label: getTranslation('Sequential'),
                                        value: AppointmentSortTypes.sequential,
                                    },
                                    {
                                        label: getTranslation('combineDatePeriodByOrganization'),
                                        value: AppointmentSortTypes.combineDatePeriodByOrganization,
                                    },
                                ]}
                            />
                        </LabelWrapper>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <LabelWrapper
                            label={
                                <LabelWithTooltip
                                    color='default'
                                    label={getTranslation('Search times by days')}
                                    tooltipText={getTranslation(
                                        'Number of days that will pass from today to start searching for timetables'
                                    )}
                                />
                            }
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'fromDay',
                            }}
                        >
                            <InputSimple
                                type={'number'}
                                max={1000}
                                min={0}
                                value={actionsRules[index].element?.fromDay}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    if ((Number(value) >= 0 && Number(value) <= 1000) || value === '') {
                                        setFieldValue(
                                            `actions[${index}].element.fromDay`,
                                            value === '' ? null : Number(value)
                                        );
                                    }
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={12}>
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
                                value={actionsRules[index].element?.priority}
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
                <Row gutter={16} style={{ marginTop: 8 }}>
                    <Col span={12}>
                        <LabelWrapper
                            label={
                                <LabelWithTooltip
                                    color='default'
                                    label={`${getTranslation('RulesCanNotConfirm')} (P)`}
                                    tooltipText={getTranslation(
                                        'Not allowing the patient to confirm their appointment through the bot'
                                    )}
                                />
                            }
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'canNotConfirmPassive',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.canNotConfirmPassive}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.canNotConfirmPassive`,
                                        !actionsRules[index].element.canNotConfirmPassive
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={12}>
                        <LabelWrapper
                            label={
                                <LabelWithTooltip
                                    color='default'
                                    label={`${getTranslation('RulesCanNotConfirm')} (A)`}
                                    tooltipText={getTranslation('Disallow active confirmation sending for this flow')}
                                />
                            }
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'canNotConfirmActive',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.canNotConfirmActive}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.canNotConfirmActive`,
                                        !actionsRules[index].element.canNotConfirmActive
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <LabelWrapper
                            label={getTranslation('RulesCanNotView')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'canNotView',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.canNotView}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.canNotView`,
                                        !actionsRules[index].element.canNotView
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={12}>
                        <LabelWrapper
                            label={
                                <LabelWithTooltip
                                    color='default'
                                    label={getTranslation('RulesCanNotReschedule')}
                                    tooltipText={getTranslation(
                                        'Disallow automatic rescheduling of this entity in the bot flow'
                                    )}
                                />
                            }
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'canNotReschedule',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.canNotReschedule}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.canNotReschedule`,
                                        !actionsRules[index].element.canNotReschedule
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={12}>
                        <LabelWrapper
                            label={
                                <LabelWithTooltip
                                    color='default'
                                    label={getTranslation('RulesCanNotCancel')}
                                    tooltipText={getTranslation(
                                        'Disallow automatic cancellation of this entity within the bot flow'
                                    )}
                                />
                            }
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'canNotCancel',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.canNotCancel}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.canNotCancel`,
                                        !actionsRules[index].element.canNotCancel
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                </Row>
                <hr />
                <Row gutter={16}>
                    <Col span={12}>
                        <LabelWrapper
                            label={getTranslation('RulesSkipIfOneItem')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'skipIfOneItem',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.skipIfOneItem}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.skipIfOneItem`,
                                        !actionsRules[index].element.skipIfOneItem
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={12}>
                        <LabelWrapper
                            label={getTranslation('Randomize schedules')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'randomize',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.randomize}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.randomize`,
                                        !actionsRules[index].element.randomize
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <LabelWrapper
                            label={getTranslation('RulesSkipSelection')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'skipSelection',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.skipSelection}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.skipSelection`,
                                        !actionsRules[index].element.skipSelection
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={12}>
                        <LabelWrapper
                            label={getTranslation('RulesSkipIfNoItem')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'skipIfNoItems',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.skipIfNoItems}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.skipIfNoItems`,
                                        !actionsRules[index].element.skipIfNoItems
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                    <Col span={12}>
                        <LabelWrapper
                            label={getTranslation('allow step back')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'canReturnStep',
                            }}
                        >
                            <Toggle
                                checked={actionsRules[index].element?.canReturnStep}
                                onChange={() => {
                                    setFieldValue(
                                        `actions[${index}].element.canReturnStep`,
                                        !actionsRules[index].element.canReturnStep
                                    );
                                }}
                            />
                        </LabelWrapper>
                    </Col>
                </Row>
                <hr />
                <div style={{ paddingTop: 5 }} />
                <LabelWrapper
                    label={getTranslation('RulesIfEmptyDataGoto')}
                    validate={{
                        touched,
                        errors,
                        isSubmitted: isSubmitted,
                        fieldName: 'ifEmptyDataGoto',
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
                                value={actionsRules[index].element?.ifEmptyDataGoto?.split(':')[1]}
                                allowClear
                                onChange={(value) => {
                                    if (!!value) {
                                        setFieldValue(`actions[${index}].element.ifEmptyDataGoto`, `${botId}:${value}`);
                                    } else {
                                        setFieldValue(`actions[${index}].element.ifEmptyDataGoto`, undefined);
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
                    label={getTranslation('RulesGuidanceBeforeScheduled')}
                    validate={{
                        touched,
                        errors,
                        isSubmitted: isSubmitted,
                        fieldName: 'guidanceBeforeScheduled',
                    }}
                >
                    <TextAreaSimple
                        value={actionsRules[index].element?.guidanceBeforeScheduled}
                        onChange={(event) => {
                            setFieldValue(`actions[${index}].element.guidanceBeforeScheduled`, event.target.value);
                        }}
                        style={{ minHeight: 70 }}
                    />
                </LabelWrapper>
                <LabelWrapper
                    label={getTranslation('RulesGuidanceAfterScheduled')}
                    validate={{
                        touched,
                        errors,
                        isSubmitted: isSubmitted,
                        fieldName: 'guidanceAfterScheduled',
                    }}
                >
                    <TextAreaSimple
                        value={actionsRules[index].element?.guidanceAfterScheduled}
                        onChange={(event) => {
                            setFieldValue(`actions[${index}].element.guidanceAfterScheduled`, event.target.value);
                        }}
                        style={{ minHeight: 70 }}
                    />
                </LabelWrapper>
                <LabelWrapper
                    label={getTranslation('RulesnoAvailableDatesMessage')}
                    validate={{
                        touched,
                        errors,
                        isSubmitted: isSubmitted,
                        fieldName: 'noAvailableDatesMessage',
                    }}
                >
                    <TextAreaSimple
                        value={actionsRules[index].element?.noAvailableDatesMessage}
                        onChange={(event) => {
                            setFieldValue(`actions[${index}].element.noAvailableDatesMessage`, event.target.value);
                        }}
                        style={{ minHeight: 70 }}
                    />
                </LabelWrapper>
            </Wrapper>
        </Wrapper>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
});

export const FlowRulesCard = I18n(withRouter(connect(mapStateToProps, {})(FlowRulesCardForm)));
