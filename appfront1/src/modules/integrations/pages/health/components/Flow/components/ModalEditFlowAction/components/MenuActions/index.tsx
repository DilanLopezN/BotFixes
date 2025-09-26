import { FlowAction, FlowActionType } from 'kissbot-core';
import { FC } from 'react';
import { Wrapper } from '../../../../../../../../../../ui-kissbot-v2/common';
import I18n from '../../../../../../../../../i18n/components/i18n';
import { MenuActionsProps } from './props';
import { Tag, Atribute, Action, GoTo, ButtonActions, Text, ContentAction, Rules, RulesConfirmation } from './styles';

const MenuLeftActions: FC<MenuActionsProps> = ({ formik, getTranslation, workspaceId }) => {
    const emptyTag: FlowAction = {
        type: FlowActionType.tag,
        element: {
            action: 'add',
            color: '#ff00d9',
            name: '',
        },
    };

    const emptyTrigger: FlowAction = {
        type: FlowActionType.postback,
        element: {
            value: '',
        },
    };

    const emptyGoTo: FlowAction = {
        type: FlowActionType.goto,
        element: {
            workspaceId: workspaceId,
            botId: '',
            value: '',
        },
    };

    const emptyAttribute: FlowAction = {
        type: FlowActionType.attribute,
        element: {
            name: '',
            action: 'add',
            value: '',
            type: '',
            label: '',
            botId: '',
        },
    };

    const emptyText: FlowAction = {
        type: FlowActionType.text,
        element: {
            text: '',
        },
    };

    const emptyRules: FlowAction = {
        type: FlowActionType.rules,
        element: {
            price: undefined,
            address: undefined,
            skipIfOneItem: false,
            skipIfNoItems: false,
            limit: undefined,
            randomize: false,
            untilDay: undefined,
            sortMethod: undefined,
            canNotCancel: false,
            canNotConfirmPassive: false,
            canNotConfirmActive: false,
            canNotView: false,
            canNotReschedule: false,
            guidanceBeforeScheduled: undefined,
            guidanceAfterScheduled: undefined,
            fromDay: undefined,
            skipSelection: false,
            priority: undefined,
            ifEmptyDataGoto: undefined,
            noAvailableDatesMessage: undefined,
        },
    };

    const emptyRulesConfirmation: FlowAction = {
        type: FlowActionType.rulesConfirmation,
        element: {
            cancelGoto: '',
            confirmationGoto: '',
            cancelMessage: '',
            confirmationMessage: '',
            priority: undefined,
        },
    };

    return (
        <Wrapper width='80px' height='100%' borderRadius='5px 0 0 5px' bgcolor='#f2f4f8'>
            <ContentAction>
                <ButtonActions
                    className='actionButton'
                    title={getTranslation('Add tag')}
                    onClick={() => {
                        let flow = formik.values;
                        flow = { ...flow, actions: [...(flow.actions || []), emptyTag] };
                        formik.setValues(flow);
                    }}
                >
                    <Tag className='actionIcon' />
                </ButtonActions>
                <Wrapper fontSize='11px' className='actionIcon'>
                    {getTranslation('Tag')}
                </Wrapper>
            </ContentAction>
            <ContentAction>
                <ButtonActions
                    className='actionButton'
                    title={getTranslation('Add attribute')}
                    onClick={() => {
                        let flow = formik.values;
                        flow = { ...flow, actions: [...(flow.actions || []), emptyAttribute] };
                        formik.setValues(flow);
                    }}
                >
                    <Atribute className='actionIcon' />
                </ButtonActions>
                <Wrapper fontSize='11px' className='actionIcon'>
                    {getTranslation('Attribute')}
                </Wrapper>
            </ContentAction>
            <ContentAction>
                <ButtonActions
                    className='actionButton'
                    title={getTranslation('Add postback')}
                    onClick={() => {
                        let flow = formik.values;
                        flow = { ...flow, actions: [...(flow.actions || []), emptyTrigger] };
                        formik.setValues(flow);
                    }}
                >
                    <Action className='actionIcon' />
                </ButtonActions>
                <Wrapper fontSize='11px' className='actionIcon'>
                    {getTranslation('Postback')}
                </Wrapper>
            </ContentAction>
            <ContentAction>
                <ButtonActions
                    className='actionButton'
                    title={getTranslation('Add goto')}
                    onClick={() => {
                        let flow = formik.values;
                        flow = { ...flow, actions: [...(flow.actions || []), emptyGoTo] };
                        formik.setValues(flow);
                    }}
                >
                    <GoTo className='actionIcon' />
                </ButtonActions>
                <Wrapper fontSize='11px' className='actionIcon'>
                    {getTranslation('Goto')}
                </Wrapper>
            </ContentAction>
            <ContentAction>
                <ButtonActions
                    className='actionButton'
                    title={getTranslation('Add text')}
                    onClick={() => {
                        let flow = formik.values;
                        flow = { ...flow, actions: [...(flow.actions || []), emptyText] };
                        formik.setValues(flow);
                    }}
                >
                    <Text className='actionIcon' />
                </ButtonActions>
                <Wrapper fontSize='11px' className='actionIcon'>
                    {getTranslation('Text')}
                </Wrapper>
            </ContentAction>
            <ContentAction>
                <ButtonActions
                    disabled={formik.values.actions.find((e) => e.type === FlowActionType.rules)}
                    className='actionButton'
                    title={getTranslation('Add rules')}
                    onClick={() => {
                        let flow = formik.values;
                        flow = { ...flow, actions: [...(flow.actions || []), emptyRules] };
                        formik.setValues(flow);
                    }}
                >
                    <Rules className='actionIcon' />
                </ButtonActions>
                <Wrapper fontSize='11px' className='actionIcon'>
                    {getTranslation('Rules')}
                </Wrapper>
            </ContentAction>
            <ContentAction>
                <ButtonActions
                    disabled={formik.values.actions.find((e) => e.type === FlowActionType.rulesConfirmation)}
                    className='actionButton'
                    title={getTranslation('Add rules confirmation')}
                    onClick={() => {
                        let flow = formik.values;
                        flow = { ...flow, actions: [...(flow.actions || []), emptyRulesConfirmation] };
                        formik.setValues(flow);
                    }}
                >
                    <RulesConfirmation className='actionIcon' />
                </ButtonActions>
                <Wrapper fontSize='11px' className='actionIcon'>
                    {getTranslation('Rules confirmation')}
                </Wrapper>
            </ContentAction>
        </Wrapper>
    );
};

export default I18n(MenuLeftActions);
