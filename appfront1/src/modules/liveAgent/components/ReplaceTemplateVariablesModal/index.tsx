import { FC, useEffect, useRef, useState } from 'react';
import { ReplaceTemplateVariablesModalProps } from './props';
import { Content, ActionsArea, VariablesArea, VariableItem, InfoArea, PreviewArea, Line } from './styled';
import { PrimaryButton } from '../../../../ui-kissbot-v2/common';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ColorType } from '../../../../ui-kissbot-v2/theme';
import { FieldArray, Form, Formik } from 'formik';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { FieldCustomFormik } from '../../../../shared/StyledForms/FieldCustomFormik';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import { Modal } from '../../../../shared/Modal/Modal';
import { IdentityType } from 'kissbot-core';
import { TemplateButtonType, TemplateVariable } from '../TemplateMessageList/interface';
import set from 'lodash/set';
import get from 'lodash/get';
import * as Handlebars from 'handlebars/dist/cjs/handlebars';
import { Identity } from '../../interfaces/conversation.interface';
import moment from 'moment';
import { formattingWhatsappText } from '../../../../utils/Activity';
import { useSelector } from 'react-redux';
import { defaultVarsTemplate } from '../../../../model/DefaultVarsTemplate';

Handlebars.registerHelper('formatPhone', (phone) => {
    let result = '';
    if (phone?.trim().length > 0) {
        phone = phone.replace(/\D/g, '');
        if (phone.length === 12 && phone.startsWith('55')) {
            const ddd = phone.substr(0, 4);
            const number = phone.substr(4);
            result = `${ddd}9${number}`;
        } else if (phone.length >= 11 && phone.startsWith('55')) {
            result = phone.substr(phone.length - 11);
        } else {
            result = phone;
        }
        if (result.length === 13 && result.startsWith('55')) {
            result = result.substr(2);
        }
    }
    return result;
});

Handlebars.registerHelper('formatDate', (date) => {
    return moment(date).format('DD/MM/YYYY - HH:mm');
});

interface VariableButton {
    index: number;
    url: string;
    value: string;
}

const ReplaceTemplateVariablesModal: FC<ReplaceTemplateVariablesModalProps & I18nProps> = ({
    template,
    onClose,
    onChange,
    onCancel,
    getTranslation,
    conversation,
    loggedUser,
}) => {
    const [currentTemplateMessage, setCurrentTemplateMessage] = useState<string>(template.message);
    const [variablesToReplace, setVariablesToReplace] = useState<TemplateVariable[]>([]);
    const [variablesToReplaceButton, setVariablesToReplaceButton] = useState<VariableButton[]>([]);

    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);

    const initialPredefinedVars = () => {
        const user = conversation.members?.find((member: Identity) => member.type === IdentityType.user);

        return {
            agent: {
                name: loggedUser.name,
            },
            conversation: {
                iid: `#${conversation.iid}`,
                createdAt: conversation.createdAt,
            },
            user: user
                ? {
                      name: user.name,
                      phone: user.phone,
                  }
                : {},
            custom: {} as { [key: string]: any },
        };
    };

    const [predefinedVars, setPredefinedVars] = useState<{ [key: string]: any }>(initialPredefinedVars());
    const [previewMessage, setPreviewMessage] = useState<string>('');

    const predefinedVarsRef: any = useRef(null);
    predefinedVarsRef.current = { predefinedVars };

    useEffect(() => {
        document.addEventListener('keydown', listeners);
        return () => document.removeEventListener('keydown', listeners);
    }, []);

    const listeners = (event: KeyboardEvent) => {
        switch (event.key) {
            case 'Escape':
                return onCancel();

            case 'Enter':
                const confirmButton = document.getElementById('confirm-variables');
                return confirmButton?.click();

            default:
                break;
        }
    };

    // pega variaveis não pré-definidas para o usuário preencher
    const getUndefinedVariables = () => {
        const list: TemplateVariable[] = [];
        const listVariableButton: VariableButton[] = [];

        // melhorar esse replace
        const message = template.message?.replace(new RegExp(/{{(.*?)}}/g), (match: any) => {
            let variable = match.replace(/{{/g, '');
            variable = variable.replace(/}}/g, '');

            const exist = template.variables.find((v) => v.value === variable);

            if (exist && !get(predefinedVars, exist.value || '')) {
                const q = exist.value.substring(0, exist.value.lastIndexOf(' '));

                if (!list.find((ele) => ele._id === exist._id)) {
                    list.push({
                        ...exist,
                        value: '',
                    });
                }

                // cria uma variavel temporaria para facilitar o replace do handlebars
                return `{{${q} custom.${exist?._id}}}`;
            }
            return `{{${exist?.value || variable}}}`;
        });

        template.buttons?.forEach((button, index) => {
            if (button.url?.endsWith('{{1}}')) {
                listVariableButton.push({ index, url: button.url, value: '' });
            }
        });

        setCurrentTemplateMessage(message);
        setVariablesToReplace(list);
        setVariablesToReplaceButton(listVariableButton);
        // se não tem variaveis para preencher, ja seta no textarea e nao abre modal
        if (list.length === 0 && !listVariableButton.length) {
            return replaceText(false, undefined, message);
        }
    };

    useEffect(() => {
        getUndefinedVariables();
    }, [template]);

    // seta no objeto custom para o replace do handlebars
    const handleSubmit = (variables: TemplateVariable[], preview: boolean) => {
        const custom = {};

        variables.forEach((variable) => {
            if (variable.value !== '') {
                set(custom, variable._id as string, variable.value);
            }
        });

        setPredefinedVars((prevState) => ({
            ...prevState,
            custom,
        }));

        return replaceText(
            preview,
            {
                ...predefinedVars,
                custom,
            },
            undefined
        );
    };

    const replaceText = (preview: boolean, vars?: any, message?: string) => {
        const { predefinedVars } = predefinedVarsRef.current;

        try {
            const templateHb = Handlebars.compile(message || currentTemplateMessage);
            let compiledText = templateHb(vars || predefinedVars);

            if (preview && template.footerMessage && template.buttons && template.buttons.length > 0) {
                compiledText += `\n\n_${template.footerMessage}_`;
            }

            if (preview) {
                return setPreviewMessage(compiledText);
            }

            const paramsTemplate: string[] = [];
            try {
                let listCustomVariable: { [key: string]: any }[] = [];
                let listDefaultVariable: { [key: string]: any }[] = [];

                const templateMessage = template.message;
                const matchs = Array.from(templateMessage.matchAll(/{{(.*?)}}/g), (m) => m[0]);

                matchs?.forEach((match: any) => {
                    let variable: string = match.replace(/{{/g, '');
                    variable = variable.replace(/}}/g, '');
                    let valueVariable;

                    const isDefault = !!defaultVarsTemplate?.find((defVar) => defVar.value === variable);
                    if (isDefault) {
                        const isDuplicateDefault = listDefaultVariable?.find((currCustom) => currCustom?.[variable]);
                        if (!isDuplicateDefault) {
                            listDefaultVariable.push({ [variable]: { id: variable, value: variable } });
                            valueVariable = get(predefinedVars, variable);
                        }
                    } else {
                        const customVar: string = Object.keys((vars || predefinedVars).custom || {})[
                            listCustomVariable.length
                        ];
                        const isDuplicateCustom = listCustomVariable?.find(
                            (currCustom) => currCustom?.custom?.value === variable
                        );

                        if (customVar && !isDuplicateCustom) {
                            listCustomVariable.push({ custom: { id: customVar, value: variable } });
                            valueVariable = get(predefinedVars, `custom.${customVar}`);
                        }
                    }

                    if (valueVariable) {
                        paramsTemplate.push(valueVariable);
                    }
                });
                variablesToReplaceButton?.forEach((buttonVar) => {
                    if (buttonVar.value) {
                        paramsTemplate.push(buttonVar.value);
                    }
                });
            } catch (err) {
                console.log('Error get params template ', err);
            }
            return onChange(compiledText, paramsTemplate);
        } catch (error) {
            return onCancel();
        }
    };

    const handleInputChange = (value: string, index: number) => {
        setVariablesToReplace((prevState) => {
            prevState[index].value = value;
            return [...prevState];
        });
    };

    useEffect(() => {
        if (variablesToReplace.length > 0 || !!variablesToReplaceButton.length) {
            handleSubmit(variablesToReplace, true);
        }
    }, [variablesToReplace]);

    return (
        <Modal
            height={'auto'}
            width='460px'
            style={{ maxHeight: '500px' }}
            className='confirmationModal'
            isOpened={!!template && (variablesToReplace.length > 0 || !!variablesToReplaceButton.length)}
            position={ModalPosition.center}
            onClickOutside={() => onClose()}
        >
            <Content>
                <InfoArea>
                    <span>{`${getTranslation('Fill in the fields to proceed with sending the message')}:`}</span>
                </InfoArea>
                <Line />
                {previewMessage !== '' && (
                    <PreviewArea>
                        <span>{formattingWhatsappText(previewMessage)}</span>
                    </PreviewArea>
                )}
                <VariablesArea>
                    <Formik
                        enableReinitialize
                        initialValues={{ variables: variablesToReplace }}
                        onSubmit={() => {}}
                        render={({ values, setFieldValue }) => {
                            return (
                                <Form style={{ width: '100%', paddingBottom: '10px' }}>
                                    <FieldArray
                                        name='variables'
                                        render={() => {
                                            return (
                                                <div>
                                                    {values.variables.map((variable, index: number) => {
                                                        const label = `${variable.label}${
                                                            variable.required ? '*' : ''
                                                        }`;

                                                        return (
                                                            <VariableItem key={variable._id}>
                                                                <LabelWrapper label={label}>
                                                                    <FieldCustomFormik
                                                                        className='form-control form-control-sm'
                                                                        name={`variables[${index}].value`}
                                                                        autoFocus={index === 0}
                                                                        autoComplete={
                                                                            selectedWorkspace.generalConfigs
                                                                                ?.enableAutoCompleteTemplateVariables
                                                                                ? 'on'
                                                                                : 'off'
                                                                        }
                                                                        as={
                                                                            variable.type === '@sys.any'
                                                                                ? 'textarea'
                                                                                : 'input'
                                                                        }
                                                                        placeholder={variable.label}
                                                                        style={{ width: '100%' }}
                                                                        onChange={(ev: any) => {
                                                                            handleInputChange(ev.target.value, index);
                                                                            values.variables[index].value =
                                                                                ev.target.value;
                                                                            setFieldValue(
                                                                                `variables[${index}].value`,
                                                                                ev.target.value
                                                                            );
                                                                        }}
                                                                    />
                                                                </LabelWrapper>
                                                            </VariableItem>
                                                        );
                                                    })}
                                                    {variablesToReplaceButton?.map((buttonVar) => {
                                                        return (
                                                            <LabelWrapper
                                                                label={`Botão URL - ${buttonVar.url.replace(
                                                                    /{{(.*?)}}/g,
                                                                    ''
                                                                )}${buttonVar.value}`}
                                                            >
                                                                <FieldCustomFormik
                                                                    className='form-control form-control-sm'
                                                                    name={`button[${buttonVar.index}]`}
                                                                    as={'input'}
                                                                    autoFocus={true}
                                                                    autoComplete={
                                                                        selectedWorkspace.generalConfigs
                                                                            ?.enableAutoCompleteTemplateVariables
                                                                            ? 'on'
                                                                            : 'off'
                                                                    }
                                                                    style={{ width: '100%' }}
                                                                    onChange={(ev: any) => {
                                                                        let newValue = {
                                                                            ...buttonVar,
                                                                            value: ev.target.value,
                                                                        };
                                                                        setVariablesToReplaceButton((prevState) => {
                                                                            return prevState.map((value) => {
                                                                                if (value.index === newValue.index) {
                                                                                    return newValue;
                                                                                }
                                                                                return value;
                                                                            });
                                                                        });
                                                                    }}
                                                                />
                                                            </LabelWrapper>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        }}
                                    />
                                    <ActionsArea>
                                        <PrimaryButton tabIndex={100} colorType={ColorType.text} onClick={onCancel}>
                                            {getTranslation('Cancel')}
                                        </PrimaryButton>
                                        <PrimaryButton
                                            id='confirm-variables'
                                            tabIndex={102}
                                            disabled={
                                                !values.variables
                                                    .filter((v) => v.required)
                                                    .every((v) => v.value !== '') ||
                                                !variablesToReplaceButton.every((v) => v.value !== '')
                                            }
                                            onClick={() => handleSubmit(values.variables, false)}
                                        >
                                            {getTranslation('Continue')}
                                        </PrimaryButton>
                                    </ActionsArea>
                                </Form>
                            );
                        }}
                    ></Formik>
                </VariablesArea>
            </Content>
        </Modal>
    );
};

export default i18n(ReplaceTemplateVariablesModal) as FC<ReplaceTemplateVariablesModalProps>;
