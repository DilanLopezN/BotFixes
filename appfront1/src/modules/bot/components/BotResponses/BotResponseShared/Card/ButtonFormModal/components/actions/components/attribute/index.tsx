import { SetAttributeAction } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import { BotAttrs } from '../../../../../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import { EntitySelect } from '../../../../../../../../../../../shared/StyledForms/EntitySelect/EntitySelect';
import { LabelWrapper } from '../../../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { Wrapper } from '../../../../../../../../../../../ui-kissbot-v2/common';
import I18n from '../../../../../../../../../../i18n/components/i18n';
import { AttributeProps } from './props';

const Delete = styled(Wrapper)`
    position: absolute;
    top: -8px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    right: 0px;
    background: #fff;
    border: 1px #ddd solid;
    border-radius: 50%;
    box-shadow: 2px 2px 6px 0px #80808024;
`;

const Minimize = styled(Wrapper)`
    position: absolute;
    top: -8px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    right: 35px;
    background: #fff;
    border: 1px #ddd solid;
    border-radius: 50%;
    box-shadow: 2px 2px 6px 0px #80808024;
`;

const AttributeCard: FC<AttributeProps> = ({
    touched,
    errors,
    isSubmitted,
    setFieldValue,
    getTranslation,
    actions,
    index,
    onDeleteAction,
    botAttributes,
    entitiesList,
}) => {
    const [entitySelected, setEntitySelected] = useState<string | undefined>(undefined);

    const checkIsEntity = (type: string) => {
        return (
            entitiesList &&
            entitiesList.length > 0 &&
            !!entitiesList.find((entity) => entity.name == type.split('@')[1] || entity.name === type)
        );
    };

    useEffect(() => {
        const entity = actions[index].element.type;

        if (checkIsEntity(entity)) return setEntitySelected(entity);
        return setEntitySelected(undefined);
    }, [actions[index].element.type]);

    const entityEntries = () => {
        if (!entitySelected) return [];

        const entity =
            entitySelected && entitySelected.includes('@')
                ? entitiesList.find((entity) => entity.name === entitySelected.split('@')[1])
                : undefined;

        return entity ? entity.entries : [];
    };

    return (
        <Wrapper
            position='relative'
            margin='12px 0'
            padding='3px 10px'
            borderRadius='5px'
            border='1px #e2e2e2 solid'
            bgcolor='#f7f7f7'
            borderBottom='1px #ddd solid'
        >
            <Delete>
                <span
                    style={{ cursor: 'pointer', margin: '0 5px', fontSize: '18px' }}
                    className='mdi mdi-12px mdi-delete-outline'
                    onClick={() => {
                        onDeleteAction(index);
                    }}
                />
            </Delete>
            <Minimize>
                <span
                    style={{ cursor: 'pointer', margin: '0 5px', fontSize: '18px' }}
                    className={`mdi mdi-12px mdi-${actions[index].maximized ? 'chevron-down' : 'chevron-right'}`}
                    onClick={() => {
                        setFieldValue(`actions[${index}].maximized`, !actions[index].maximized);
                    }}
                />
            </Minimize>

            {actions[index].maximized ? (
                <>
                    <Wrapper fontSize='17px' margin='-1px 0 5px -3px'>
                        {getTranslation('Attribute')}
                    </Wrapper>
                    <LabelWrapper label={getTranslation('Attribute')}>
                        <BotAttrs
                            value={{
                                value: actions[index].element.name || '',
                                label: actions[index].element.name || '',
                            }}
                            onCreateOption={(ev) => {
                                setFieldValue(`actions[${index}].element.name`, ev);
                                setFieldValue(`actions[${index}].element.label`, ev);
                                setFieldValue(`actions[${index}].element.type`, '@sys.any');
                            }}
                            onChange={(event) => {
                                setFieldValue(`actions[${index}].element.name`, event.value);
                                setFieldValue(`actions[${index}].element.label`, event.value);
                                const botAttr = botAttributes.find((attr) => attr.name === event.value);

                                if (botAttr) {
                                    setFieldValue(`actions[${index}].element.type`, botAttr.type);
                                }
                            }}
                            showOnly={['defaults', 'entity', 'others']}
                            creatable
                        />
                    </LabelWrapper>

                    <LabelWrapper label={getTranslation('Action')}>
                        <StyledFormikField name={`actions[${index}].element.action`} component='select'>
                            <option value={SetAttributeAction.set}>{getTranslation('add')}</option>
                            <option value={SetAttributeAction.remove}>{getTranslation('remove')}</option>
                        </StyledFormikField>
                    </LabelWrapper>

                    {actions[index].element.action === SetAttributeAction.set && (
                        <LabelWrapper label={getTranslation('Entity')}>
                            <EntitySelect
                                fieldName={`actions[${index}].element.type`}
                                onChange={(ev) => {
                                    setFieldValue(`actions[${index}].element.type`, ev.target.value);

                                    if (checkIsEntity(ev.target.value)) return setEntitySelected(ev.target.value);

                                    return setEntitySelected(undefined);
                                }}
                            />
                        </LabelWrapper>
                    )}

                    {actions[index].element.action === SetAttributeAction.set && entitySelected ? (
                        <LabelWrapper
                            label={getTranslation('Value')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'value',
                            }}
                        >
                            <StyledFormikField name={`actions[${index}].element.value`} component='select'>
                                <option value='no-select'>{getTranslation('Select a synonym as value')}</option>
                                {entityEntries().map((entry) => {
                                    return (
                                        <option value={entry.name} key={entry._id}>
                                            {entry.name}
                                        </option>
                                    );
                                })}
                            </StyledFormikField>
                        </LabelWrapper>
                    ) : (
                        <LabelWrapper
                            label={getTranslation('Value')}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'value',
                            }}
                        >
                            <StyledFormikField
                                type='text'
                                name={`actions[${index}].element.value`}
                                placeholder={'Value'}
                            />
                        </LabelWrapper>
                    )}

                    {actions[index].element.action === SetAttributeAction.set && (
                        <LabelWrapper
                            label={'Label'}
                            validate={{
                                touched,
                                errors,
                                isSubmitted: isSubmitted,
                                fieldName: 'label',
                            }}
                        >
                            <StyledFormikField
                                type='text'
                                name={`actions[${index}].element.label`}
                                placeholder={'Label'}
                            />
                        </LabelWrapper>
                    )}
                </>
            ) : (
                <Wrapper>
                    <Wrapper>
                        {actions[index].element.action === SetAttributeAction.set ? '+' : '-'}{' '}
                        {getTranslation('Attribute')}
                    </Wrapper>
                    <Wrapper flexBox>
                        <Wrapper margin='0 3px 0 20px' fontWeight='600'>
                            {actions[index].element.name} ::
                        </Wrapper>
                        <Wrapper margin='0 3px' color='#777'>
                            {actions[index].element.type}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrapper>
    );
};

export default I18n(AttributeCard);
