import { FC, useEffect, useState } from 'react';
import './Intents.scss';
import { IntentsFormProps } from './IntentsFormProps';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';
import i18n from '../../../../i18n/components/i18n';
import { useFormik } from 'formik-latest';
import { Divider, Modal, Select } from 'antd';
import { BotService } from '../../../services/BotService';
import { useSelector } from 'react-redux';
import { AddBtn } from '../../../../../shared/StyledForms/AddBtn/AddBtn';
import { IntentsInterface } from '../../../Interfaces/Intent.Interface';
import { DeleteBtn } from '../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';
import { RiSearchEyeLine } from 'react-icons/ri';

const IntentsForm: FC<IntentsFormProps & I18nProps> = (props) => {
    const { getTranslation, intents, onChangeInput } = props;
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const { currentBot } = useSelector((state: any) => state.botReducer);
    const [intentOptions, setIntentOptions] = useState<IntentsInterface[]>([]);

    const closeModal = () => {
        Modal.destroyAll();
    };
    const modalInfo = (attributes) => {
        Modal.info({
            title: 'Atributos',
            okButtonProps: {
                className: 'antd-span-default-color',
            },
            afterClose: closeModal,
            content: (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {attributes?.map((attr, index) => {
                        return (
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '5px',
                                    }}
                                >
                                    <span style={{ width: '50%' }}>
                                        <strong>Label: </strong>
                                        {attr.label}
                                    </span>
                                    <span style={{ width: '50%' }}>
                                        <strong>Nome: </strong>
                                        {attr.name}
                                    </span>
                                </div>
                                {index !== attributes.length - 1 && <Divider style={{ margin: '10px 0' }} />}
                            </div>
                        );
                    })}
                </div>
            ),
        });
    };

    const getIntents = async () => {
        const result = await BotService.getIntentsByWorkspaceIdAndBotId(selectedWorkspace._id, currentBot._id);

        setIntentOptions(result ?? []);
    };

    useEffect(() => {
        getIntents();
    }, []);

    const formik = useFormik({
        initialValues: intents.length ? { intents: intents } : { intents: [''] },
        // enableReinitialize: true,
        onSubmit: () => {
            formik.setSubmitting(true);
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    const values = formik.values.intents.filter((curr) => !!curr);
                    onChangeInput(values);
                }
            });
        },
    });

    const options = (value: string) => {
        return intentOptions
            .filter(
                (currIntent) =>
                    !formik.values.intents?.find((curr) => curr === currIntent.name && currIntent.name !== value)
            )
            .map((currElement) => ({ label: currElement.label, value: currElement.name }));
    };
    return (
        <DisabledTypeContext.Consumer>
            {({ disabledFields }) => {
                return (
                    <div className={'Intents'}>
                        <LabelWrapper label='Intenções' asTitle={true} tooltip='Intenções'>
                            <form>
                                {formik.values.intents.map((intent, index) => {
                                    const attributes =
                                        intentOptions?.find((curr) => curr.name === intent)?.attributes || null;
                                    return (
                                        <div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Select
                                                    style={{ width: '100%', marginBottom: '10px' }}
                                                    size='large'
                                                    disabled={disabledFields}
                                                    allowClear
                                                    value={intent}
                                                    options={options(intent)}
                                                    onChange={(value) => {
                                                        if (!value) {
                                                            formik.setFieldValue(`intents[${index}]`, '');
                                                        } else {
                                                            formik.setFieldValue(`intents[${index}]`, value);
                                                        }
                                                        formik.submitForm();
                                                    }}
                                                />
                                                <div style={{ display: 'flex', alignItems: 'center', width: '55px' }}>
                                                    {!disabledFields ? (
                                                        <DeleteBtn
                                                            className='icon-delete'
                                                            title={getTranslation('Delete')}
                                                            onClick={() => {
                                                                if (formik.values.intents.length > 1) {
                                                                    let values = formik.values.intents;
                                                                    values.splice(index, 1);
                                                                    formik.setFieldValue('intents', values);
                                                                } else {
                                                                    formik.setFieldValue('intents', ['']);
                                                                }
                                                                formik.submitForm();
                                                            }}
                                                        />
                                                    ) : null}
                                                    {attributes?.length ? (
                                                        <RiSearchEyeLine
                                                            style={{
                                                                width: '22px',
                                                                height: '22px',
                                                                cursor: 'pointer',
                                                            }}
                                                            title='Visualizar atributos da intenção'
                                                            onClick={() => {
                                                                modalInfo(attributes);
                                                            }}
                                                        />
                                                    ) : null}
                                                </div>
                                            </div>
                                            {!disabledFields &&
                                            formik.values.intents.length < intentOptions.length &&
                                            index === formik.values.intents.length - 1 ? (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <AddBtn
                                                        className='add'
                                                        onClick={() => {
                                                            let newIntents = formik.values.intents;
                                                            newIntents.push('');
                                                            formik.setFieldValue('intents', newIntents);
                                                        }}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </form>
                        </LabelWrapper>
                    </div>
                );
            }}
        </DisabledTypeContext.Consumer>
    );
};

export default i18n(IntentsForm) as FC<IntentsFormProps>;
