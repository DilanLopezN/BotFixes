import { Button, Input, Popover, Select, Tooltip } from 'antd';
import { FC, useEffect, useState } from 'react';
import { v4 } from 'uuid';
import { defaultVarsTemplate } from '../../../../../../../../model/DefaultVarsTemplate';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import i18n from '../../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import { TemplateVariable } from '../../../../../../../liveAgent/components/TemplateMessageList/interface';
import { emptyVariable } from '../../../EditTemplate';
import { useTemplateVariableContext } from '../../context';

interface BlockProps {
    props: any;
    setOpenEditVariable: React.Dispatch<React.SetStateAction<boolean>>;
    onChangeVariable: (value, start, end) => void;
    isHsm: boolean;
}

const Block: FC<BlockProps & I18nProps> = ({ getTranslation, props, setOpenEditVariable, onChangeVariable, isHsm }) => {
    const { templateVariables } = useTemplateVariableContext();
    const text = props?.decoratedText?.replace(/[{,}]/g, '');
    const variableDefault = {
        ...emptyVariable,
        value: text.replaceAll(' ', '_'),
        label: text,
        sampleValue: '',
        _id: v4(),
    };
    const getVariable = () => {
        try {
            const existVariable = templateVariables?.find((entity) => entity.value === text);
            if (!!existVariable) {
                return existVariable;
            }
            return variableDefault;
        } catch (e) {
            return variableDefault;
        }
    };

    const isDefault = !!defaultVarsTemplate.find((curr) => curr.value === text);

    const [open, setOpen] = useState<boolean | undefined>(undefined);
    const [defaultVariable, setDefaultVariable] = useState<boolean>(isDefault);
    const [variable, setVariable] = useState<TemplateVariable>(getVariable());

    const isVariableDataValid = (variableToValidate?: TemplateVariable) => {
        if (!variableToValidate) {
            return false;
        }

        const hasValue = !!variableToValidate.value?.trim();
        const hasLabel = !!variableToValidate.label?.trim();
        const hasSample = !isHsm || !!variableToValidate.sampleValue?.trim();

        return hasValue && hasLabel && hasSample;
    };

    const savedVariable = templateVariables.find((curr) => curr?.value === text);
    const shouldHighlightAsPending = !isDefault && !isVariableDataValid(savedVariable);

    useEffect(() => {
        if (open) {
            setVariable(getVariable());
        } else {
            setTimeout(() => {
                setDefaultVariable(isDefault);
            }, 500);
        }
    }, [open]);

    const isConfirmDisabled = !defaultVariable && !isVariableDataValid(variable);

    return (
        <Popover
            title={getTranslation('Variable editing')}
            key={variable?._id}
            trigger={'click'}
            placement='bottom'
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                setOpenEditVariable(value);
            }}
            content={
                <div
                    style={{ width: '300px' }}
                    onBlur={(event) => event.stopPropagation()}
                    onChange={(event) => event.stopPropagation()}
                >
                    <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                        {getTranslation('Fill in the fields or select one of the standard system variables')}
                    </div>
                    {defaultVariable ? (
                        <LabelWrapper
                            label={getTranslation('Default variable')}
                            tooltip={getTranslation('Automatically filled in by the system when sending the template')}
                        >
                            <Select
                                style={{ width: '100%' }}
                                value={variable.value}
                                options={defaultVarsTemplate.map((currVar) => ({
                                    label: currVar.label,
                                    value: currVar.value,
                                }))}
                                onChange={(value) => {
                                    const selected = defaultVarsTemplate.find((curr) => curr.value === value);
                                    setVariable(selected as TemplateVariable);
                                }}
                            />
                        </LabelWrapper>
                    ) : (
                        <>
                            <LabelWrapper
                                label={`${getTranslation('Value')}*`}
                                tooltip={getTranslation('Variable value for identification')}
                            >
                                <Input
                                    key='input-variable-value'
                                    autoFocus
                                    value={variable.value}
                                    onChange={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        let text = event.target.value.replaceAll(' ', '_');
                                        text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                                        text = text.replace(/[[\]{}.,?!/=+*\\|:;@#$%&()'"`]/g, "_");
                                        setVariable({ ...variable, value: text });
                                    }}
                                />
                            </LabelWrapper>
                            <LabelWrapper
                                label={`${getTranslation('Field name')}*`}
                                tooltip={getTranslation('Name that will be displayed when filling out')}
                            >
                                <Input
                                    value={variable.label}
                                    onChange={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setVariable({ ...variable, label: event.target.value });
                                    }}
                                />
                            </LabelWrapper>
                            {isHsm ? (
                                <LabelWrapper
                                    label={`${getTranslation('Example')}*`}
                                    tooltip={getTranslation('Example that will be sent instead of the variable for WhatsApp approval')}
                                >
                                    <Input
                                        value={variable.sampleValue}
                                        onChange={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setVariable({ ...variable, sampleValue: event.target.value });
                                        }}
                                    />
                                </LabelWrapper>
                            ) : null}
                        </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <Button
                            size='small'
                            style={{ marginRight: '10px' }}
                            className='antd-span-default-color'
                            onClick={() => {
                                const value = !defaultVariable;
                                setDefaultVariable(!defaultVariable);
                                if (value) {
                                    setVariable({ ...variableDefault, label: 'agent.name', value: 'agent.name' });
                                } else {
                                    setVariable(getVariable());
                                }
                            }}
                            type='default'
                        >
                            {getTranslation(defaultVariable ? 'Populate with custom variable' : 'select default variable')}
                        </Button>
                        <Button
                            size='small'
                            className='antd-span-default-color'
                            disabled={isConfirmDisabled}
                            onClick={() => {
                                if (isConfirmDisabled) return;
                                setOpen(false);
                                onChangeVariable(variable, props.start, props.end);
                                setOpenEditVariable(false);
                            }}
                            type='primary'
                        >
                            OK
                        </Button>
                    </div>
                </div>
            }
        >
            {shouldHighlightAsPending ? (
                <Tooltip placement='bottom' title={getTranslation('Variable has not yet been edited')} color={'#ef3232'}>
                    <div
                        data-offset-key={props?.offsetKey}
                        style={{
                            background: '#fde9ef',
                            width: 'fit-content',
                            display: 'inline-block',
                            cursor: 'pointer',
                        }}
                    >
                        {props.children}
                    </div>
                </Tooltip>
            ) : (
                <div
                    data-offset-key={props?.offsetKey}
                    title={isDefault ? defaultVarsTemplate.find((curr) => curr.value === text)?.label : variable?.label}
                    style={{
                        background: isDefault ? '#d8ffe4' : '#e6f7ff',
                        width: 'fit-content',
                        display: 'inline-block',
                        cursor: 'pointer',
                    }}
                >
                    {props.children}
                </div>
            )}
        </Popover>
    );
};

export default i18n(Block) as FC<BlockProps>;
