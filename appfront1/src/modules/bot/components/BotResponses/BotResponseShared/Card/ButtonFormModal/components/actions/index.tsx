import { FieldArray } from 'formik';
import { ButtonActionType, SetAttributeAction, TagsElementAction } from 'kissbot-core';
import { FC, RefObject, createRef, useEffect } from 'react';
import { v4 } from 'uuid';
import { Wrapper } from '../../../../../../../../../ui-kissbot-v2/common';
import { getRandomColor } from '../../../../../../../../../utils/getRandomColor';
import I18n from '../../../../../../../../i18n/components/i18n';
import AttributeCard from './components/attribute';
import TagCard from './components/tag';
import { ActionsProps } from './props';
import { Wrapped } from './styles';

const Btn = ({ onSelected, title }) => (
    <Wrapper
        onClick={() => onSelected()}
        height='37px'
        margin='5px 0'
        cursor='pointer'
        borderRadius='5px'
        border='1px #007bff solid'
        color='#007bff'
        alignItems='center'
        textAlign='center'
        fontWeight='600'
    >
        {title}
    </Wrapper>
);

const Actions: FC<ActionsProps> = ({
    getTranslation,
    values,
    touched,
    errors,
    isSubmitted,
    setFieldValue,
    botAttributes,
    entitiesList,
}) => {
    const messagesEnd: RefObject<any> = createRef();

    useEffect(() => {
        messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
    }, [values.actions && values.actions.length]);

    const getView = (props) => {
        switch (props.action.type) {
            case ButtonActionType.tag:
                return (
                    <TagCard
                        key={`tag:${props.action.id}`}
                        onDeleteAction={(index) => {
                            values.actions && values.actions.splice(index, 1);
                            setFieldValue('actions', values.actions);
                        }}
                        {...props}
                    />
                );

            case ButtonActionType.attribute:
                return (
                    <AttributeCard
                        key={`attr:${props.action.id}`}
                        entitiesList={entitiesList}
                        botAttributes={botAttributes}
                        onDeleteAction={(index) => {
                            values.actions && values.actions.splice(index, 1);
                            setFieldValue('actions', values.actions);
                        }}
                        {...props}
                    />
                );

            default:
                break;
        }
    };

    const emptyTag = () => {
        return {
            maximized: true,
            id: v4(),
            type: ButtonActionType.tag,
            element: {
                action: TagsElementAction.ADD,
                color: getRandomColor(),
                name: '',
            },
        };
    };

    const emptyAttribute = () => {
        return {
            maximized: true,
            id: v4(),
            type: ButtonActionType.attribute,
            element: {
                name: '',
                action: SetAttributeAction.set,
                value: '',
                type: '',
                label: '',
            },
        };
    };

    return (
        <Wrapper>
            <FieldArray
                name='actions'
                render={() => {
                    return (
                        <Wrapped
                            maxHeight='650px'
                            height='100%'
                            flexDirection='column'
                            padding='0 4px'
                            overflowY='auto'
                        >
                            {values.actions &&
                                values.actions.map((action, index) => {
                                    return getView({
                                        values,
                                        touched,
                                        errors,
                                        isSubmitted,
                                        setFieldValue,
                                        action,
                                        index,
                                        actions: values.actions,
                                    });
                                })}
                            <div style={{ float: 'left', clear: 'both' }} ref={messagesEnd}></div>
                        </Wrapped>
                    );
                }}
            />
            <Wrapper>
                <Btn
                    title={getTranslation('Add tag')}
                    onSelected={() => {
                        values.actions = [...(values.actions || []), emptyTag()];
                        setFieldValue('actions', values.actions);
                    }}
                />
                <Btn
                    title={getTranslation('Add Attribute')}
                    onSelected={() => {
                        values.actions = [...(values.actions || []), emptyAttribute()];
                        setFieldValue('actions', values.actions);
                    }}
                />
            </Wrapper>
        </Wrapper>
    );
};

export default I18n(Actions);
