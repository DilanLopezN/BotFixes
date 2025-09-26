import { FC, useEffect, useState } from 'react';
import { BotAttribute } from '../../../../../../../../../../model/BotAttribute';
import { InputSimple } from '../../../../../../../../../../shared/InputSample/InputSimple';
import { SimpleSelect } from '../../../../../../../../../../shared/SimpleSelect/SimpleSelect';
import { BotAttrs } from '../../../../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import { EntitySelect } from '../../../../../../../../../../shared/StyledForms/EntitySelect/EntitySelect';
import { LabelWrapper } from '../../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Wrapper } from '../../../../../../../../../../ui-kissbot-v2/common';
import { BotService } from '../../../../../../../../../bot/services/BotService';
import I18n from '../../../../../../../../../i18n/components/i18n';
import MenuLeftActions from '../MenuLeftActions';
import { FlowAttributeCardProps } from './props';

const FlowAttributeCard: FC<FlowAttributeCardProps> = ({
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
    entitiesList,
    validation,
}) => {
    const [entitySelected, setEntitySelected] = useState<string | undefined>(undefined);
    const actionsAttribute: any[] = values;
    const [botAttributes, setBotAttributes] = useState<BotAttribute[]>([]);
    const removeAtribute: boolean = actionsAttribute[index].element.action === 'add';

    const checkIsEntity = (type: string) => {
        return (
            entitiesList &&
            entitiesList.length > 0 &&
            !!entitiesList.find((entity) => entity.name == type.split('@')[1] || entity.name === type)
        );
    };

    useEffect(() => {
        const entity = actionsAttribute[index].element.type;

        if (checkIsEntity(entity)) return setEntitySelected(entity);
        return setEntitySelected(undefined);
    }, [actionsAttribute[index].element.type]);

    const getBotAttributes = async (botId: string) => {
        const attributes = await BotService.getBotAttributes(workspaceId, botId);
        setBotAttributes(attributes.data);
    };

    const entityEntries = () => {
        if (!entitySelected) return [];

        const entity = entitiesList.find((entity) => entity.name === entitySelected.split('@')[1]);
        return entity ? entity.entries : [];
    };

    useEffect(() => {
        if (actionsAttribute[index].element.botId) {
            getBotAttributes(actionsAttribute[index].element.botId);
        }
    }, []);

    return (
        <Wrapper margin='0 0 -50px 0'>
            <Wrapper fontSize='16px' margin='10px 45px -60px' width='90%'>
                {getTranslation('Attribute')}
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
                    label={`${getTranslation('Select one')} bot`}
                    validate={{
                        touched,
                        errors,
                        isSubmitted: isSubmitted,
                        fieldName: 'bot',
                    }}
                >
                    <SimpleSelect
                        value={actionsAttribute[index].element.botId}
                        onChange={(event) => {
                            event.preventDefault();
                            if (event.target.value !== '') {
                                getBotAttributes(event.target.value);
                                setFieldValue(`actions[${index}].element.botId`, event.target.value);
                                actionsAttribute[index].element.botId = event.target.value;
                            }
                        }}
                    >
                        <option value={''}>{`${getTranslation('Select one')} bot`}</option>
                        {bots &&
                            bots.length > 0 &&
                            bots.map((bot) => {
                                return <option value={bot._id}>{bot.name}</option>;
                            })}
                    </SimpleSelect>
                    {validation[index] === false && actionsAttribute[index].element.botId === '' && (
                        <div style={{ color: 'red', fontSize: '12px' }}>{getTranslation('This field is required')}</div>
                    )}
                </LabelWrapper>
                {botAttributes.length > 0 && (
                    <>
                        <LabelWrapper label={getTranslation('Attribute')}>
                            <BotAttrs
                                botAttributesFlow={botAttributes}
                                value={{
                                    value: actionsAttribute[index].element.name || '',
                                    label: actionsAttribute[index].element.name || '',
                                }}
                                onCreateOption={(ev) => {
                                    setFieldValue(`actions[${index}].element.name`, ev);
                                    actionsAttribute[index].element.name = ev;
                                    setFieldValue(`actions[${index}].element.label`, ev);
                                    actionsAttribute[index].element.label = ev;
                                    setFieldValue(`actions[${index}].element.type`, '@sys.any');
                                    actionsAttribute[index].element.type = '@sys.any';
                                }}
                                onChange={(event) => {
                                    actionsAttribute[index].element.label = event.value;
                                    actionsAttribute[index].element.name = event.value;
                                    setFieldValue(`actions[${index}].element.name`, event.value);
                                    setFieldValue(`actions[${index}].element.label`, event.value);
                                    const botAttr = botAttributes.find((attr) => attr.name === event.value);

                                    if (botAttr) {
                                        actionsAttribute[index].element.type = botAttr.type || '@sys.any';
                                        setFieldValue(`actions[${index}].element.type`, botAttr.type || '@sys.any');
                                    }
                                }}
                                showOnly={['defaults', 'entity', 'others']}
                                creatable
                            />
                            {validation[index] === false && actionsAttribute[index].element.name === '' && (
                                <div style={{ color: 'red', fontSize: '12px' }}>
                                    {getTranslation('This field is required')}
                                </div>
                            )}
                        </LabelWrapper>
                        <LabelWrapper label={getTranslation('Action')}>
                            <SimpleSelect
                                onChange={(event) => {
                                    event.preventDefault();
                                    const selectedValue = event.target.value;
                                    if (selectedValue !== 'add') {
                                        setFieldValue(`actions[${index}].element.value`, '');
                                    }
                                    setFieldValue(`actions[${index}].element.action`, event.target.value);
                                }}
                                value={actionsAttribute[index].element.action}
                            >
                                <option value={'add'}>{getTranslation('add')}</option>
                                <option value={'remove'}>{getTranslation('remove')}</option>
                            </SimpleSelect>
                        </LabelWrapper>
                        {removeAtribute && (
                            <LabelWrapper label={getTranslation('Entity')}>
                                <EntitySelect
                                    fieldName={`actions[${index}].element.type`}
                                    entitiesListFlow={entitiesList}
                                    value={actionsAttribute[index].element.type}
                                    onChange={(ev) => {
                                        ev.preventDefault();
                                        actionsAttribute[index].element.type = ev.target.value;
                                        setFieldValue(`actions[${index}].element.type`, ev.target.value);

                                        if (checkIsEntity(ev.target.value)) return setEntitySelected(ev.target.value);

                                        return setEntitySelected(undefined);
                                    }}
                                />
                            </LabelWrapper>
                        )}
                        {removeAtribute && entitySelected && (
                            <LabelWrapper
                                label={getTranslation('Value')}
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: isSubmitted,
                                    fieldName: 'value',
                                }}
                            >
                                <SimpleSelect
                                    onChange={(event) => {
                                        event.preventDefault();
                                        actionsAttribute[index].element.type = event.target.value;
                                        setFieldValue(`actions[${index}].element.value`, event.target.value);
                                    }}
                                    value={actionsAttribute[index].element.value}
                                >
                                    <option value='no-select'>{getTranslation('Select a synonym as value')}</option>
                                    {entityEntries().map((entry) => {
                                        return (
                                            <option value={entry.name} key={entry._id}>
                                                {entry.name}
                                            </option>
                                        );
                                    })}
                                </SimpleSelect>
                                {validation[index] === false && actionsAttribute[index].element.value === '' && (
                                    <div style={{ color: 'red', fontSize: '12px' }}>
                                        {getTranslation('This field is required')}
                                    </div>
                                )}
                            </LabelWrapper>
                        )}
                        {removeAtribute && (
                            <LabelWrapper
                                label={getTranslation('Value')}
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: isSubmitted,
                                    fieldName: 'value',
                                }}
                            >
                                <InputSimple
                                    placeholder={getTranslation('Value')}
                                    value={actionsAttribute[index].element.value}
                                    onChange={(value) => {
                                        setFieldValue(`actions[${index}].element.value`, value.target.value);
                                    }}
                                />
                                {validation[index] === false &&
                                    actionsAttribute[index].element.action === 'add' &&
                                    actionsAttribute[index].element.value === '' && (
                                        <div style={{ color: 'red', fontSize: '12px' }}>
                                            {getTranslation('This field is required')}
                                        </div>
                                    )}
                            </LabelWrapper>
                        )}
                        {actionsAttribute[index].element.action === 'add' && (
                            <LabelWrapper
                                label={getTranslation('Label')}
                                validate={{
                                    touched,
                                    errors,
                                    isSubmitted: isSubmitted,
                                    fieldName: 'label',
                                }}
                            >
                                <InputSimple
                                    placeholder={getTranslation('Label')}
                                    value={actionsAttribute[index].element.label}
                                    onChange={(value) => {
                                        setFieldValue(`actions[${index}].element.label`, value.target.value);
                                    }}
                                />
                                {validation[index] === false && actionsAttribute[index].element.label === '' && (
                                    <div style={{ color: 'red', fontSize: '12px' }}>
                                        {getTranslation('This field is required')}
                                    </div>
                                )}
                            </LabelWrapper>
                        )}
                    </>
                )}
            </Wrapper>
        </Wrapper>
    );
};

export default I18n(FlowAttributeCard);
