import { Input, Select, Card, Typography, Tooltip } from 'antd';
import { Formik } from 'formik';
import { IButtonFlow, IResponseElementWhatsappFlow } from 'kissbot-core';
import { Component } from 'react';
import { connect } from 'react-redux';
import * as Yup from 'yup';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { BotAttrs } from '../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import { dispatchSentryError } from '../../../../../../utils/Sentry';
import I18n from '../../../../../i18n/components/i18n';
import { FlowCardProps } from './props';
import { CardWrapper, StyledForm } from './styles';
import { FlowDataService } from '../../../../../settings/service/FlowDataService';
import { Workspace } from '../../../../../../model/Workspace';
import { BotAttribute } from '../../../../../../model/BotAttribute';

interface FlowCardPropsExtended extends FlowCardProps {
    selectedWorkspace: Workspace;
    botAttributes: BotAttribute[];
}

interface FlowCardState {
    flowDataList: Array<{ id: string; name: string; data: any }>;
    selectedFlowData: any;
}

class FlowCardClass extends Component<FlowCardPropsExtended, FlowCardState> {
    state: FlowCardState = {
        flowDataList: [],
        selectedFlowData: null,
    };

    WrapperFieldDataAttr = ({
        values,
        setValues,
        setFieldTouched,
        setFieldValue,
        submit,
        touched,
        errors,
        fieldName,
        fieldTitle,
    }) => {
        const flowDataValue = this.state.selectedFlowData?.data?.[fieldName];
        const hasFlowDataValue = flowDataValue !== undefined && flowDataValue !== null && flowDataValue !== '';

        return (
            <LabelWrapper
                label={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px' }}>{fieldTitle}</span>
                        {hasFlowDataValue && (
                            <Tooltip
                                title={`Valor padrão preenchido no flow: \n ${String(flowDataValue)}`}
                                placement='top'
                            >
                                <span
                                    style={{
                                        color: '#40a9ff',
                                        cursor: 'help',
                                        marginLeft: '4px',
                                        fontSize: '14px',
                                    }}
                                >
                                    ⓘ
                                </span>
                            </Tooltip>
                        )}
                    </div>
                }
                validate={{
                    touched,
                    errors,
                    fieldName: `data.${fieldName}`,
                    isSubmitted: this.props.isSubmitted,
                }}
            >
                <BotAttrs
                    value={{
                        name: values.data?.[fieldName] ? values.data[fieldName] : '',
                        label: values.data?.[fieldName] ? values.data[fieldName] : '',
                    }}
                    onCreateOption={(event) => {
                        setFieldTouched(`data.${fieldName}`);
                        const attributeValue = event;
                        const newData = { ...values.data, [fieldName]: attributeValue };
                        const updatedValues = { ...values, data: newData };
                        setFieldValue('data', newData);
                        setFieldValue(`data.${fieldName}`, attributeValue);
                        setValues(updatedValues);
                        // Chama onChange imediatamente com os valores atualizados
                        setTimeout(() => this.onChange(updatedValues, true), 0);
                    }}
                    onChange={(event) => {
                        setFieldTouched(`data.${fieldName}`);
                        if (event && event.value) {
                            const attributeValue = event.value.name || event.value;
                            const newData = { ...values.data, [fieldName]: attributeValue };
                            const updatedValues = { ...values, data: newData };
                            setFieldValue('data', newData);
                            setFieldValue(`data.${fieldName}`, attributeValue);
                            setValues(updatedValues);
                            // Chama onChange imediatamente com os valores atualizados
                            setTimeout(() => this.onChange(updatedValues, true), 0);
                        } else {
                            const newData = { ...values.data };
                            delete newData[fieldName];
                            const updatedValues = { ...values, data: newData };
                            setFieldValue('data', newData);
                            setFieldValue(`data.${fieldName}`, undefined);
                            setValues(updatedValues);
                            // Chama onChange imediatamente com os valores atualizados
                            setTimeout(() => this.onChange(updatedValues, true), 0);
                        }
                    }}
                    botAttributes={this.props.botAttributes || []}
                    showOnly={['defaults', 'entity', 'others']}
                    creatable={true}
                />
            </LabelWrapper>
        );
    };

    WrapperFieldAttr = ({
        values,
        setValues,
        setFieldTouched,
        setFieldValue,
        submit,
        touched,
        errors,
        fieldName,
        fieldTitle,
    }) => {
        return (
            <LabelWrapper
                label={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px' }}>{fieldTitle}</span>
                        <Tooltip
                            title={`Selecione em qual atributo sera guardado o valor da resposta para o campo do flow`}
                            placement='top'
                        >
                            <span
                                style={{
                                    color: '#40a9ff',
                                    cursor: 'help',
                                    marginLeft: '4px',
                                    fontSize: '14px',
                                }}
                            >
                                ⓘ
                            </span>
                        </Tooltip>
                    </div>
                }
                validate={{
                    touched,
                    errors,
                    fieldName: `attributes.${fieldName}`,
                    isSubmitted: this.props.isSubmitted,
                }}
            >
                <BotAttrs
                    value={{
                        name: values.attributes?.[fieldName] ? values.attributes[fieldName] : '',
                        label: values.attributes?.[fieldName] ? values.attributes[fieldName] : '',
                    }}
                    onCreateOption={(event) => {
                        setFieldTouched(`attributes.${fieldName}`);
                        const attributeValue = event;
                        const newData = { ...values.attributes, [fieldName]: attributeValue };
                        const updatedValues = { ...values, attributes: newData };
                        setFieldValue('attributes', newData);
                        setFieldValue(`attributes.${fieldName}`, attributeValue);
                        setValues(updatedValues);
                        // Chama onChange imediatamente com os valores atualizados
                        setTimeout(() => this.onChange(updatedValues, true), 0);
                    }}
                    onChange={(event) => {
                        setFieldTouched(`attributes.${fieldName}`);
                        if (event && event.value) {
                            const attributeValue = event.value.name || event.value;
                            const newData = { ...values.attributes, [fieldName]: attributeValue };
                            const updatedValues = { ...values, attributes: newData };
                            setFieldValue('attributes', newData);
                            setFieldValue(`attributes.${fieldName}`, attributeValue);
                            setValues(updatedValues);
                            // Chama onChange imediatamente com os valores atualizados
                            setTimeout(() => this.onChange(updatedValues, true), 0);
                        } else {
                            const newData = { ...values.attributes };
                            delete newData[fieldName];
                            const updatedValues = { ...values, attributes: newData };
                            setFieldValue('attributes', newData);
                            setFieldValue(`attributes.${fieldName}`, undefined);
                            setValues(updatedValues);
                            // Chama onChange imediatamente com os valores atualizados
                            setTimeout(() => this.onChange(updatedValues, true), 0);
                        }
                    }}
                    botAttributes={this.props.botAttributes || []}
                    showOnly={['defaults', 'entity', 'others']}
                    creatable={true}
                />
            </LabelWrapper>
        );
    };

    getValidationSchema = () => {
        const { getTranslation } = this.props;
        return Yup.object().shape({
            text: Yup.string().required(getTranslation('O campo "Texto" é obrigatório')),
            button: Yup.object().shape({
                title: Yup.string().required(getTranslation('O título do botão é obrigatório')),
                value: Yup.mixed().required(getTranslation('O FlowData é obrigatório')),
            }),
            title: Yup.string().max(60, getTranslation('O título deve ter no máximo 60 caracteres')),
            footer: Yup.string().max(60, getTranslation('A mensagem do rodapé deve ter no máximo 60 caracteres')),
            data: Yup.object().nullable(),
        });
    };

    getFlowDataList = async () => {
        try {
            const response = await FlowDataService.getFlowDataByWorkspaceIdAndFlow(
                this.props.selectedWorkspace._id as string
            );
            if (response && response.data) {
                this.setState({ flowDataList: response.data });
            }
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    getFlowDataById = async (flowDataId: string) => {
        try {
            const response = await FlowDataService.getFlowDataByIdAndFlow(
                this.props.selectedWorkspace._id as string,
                parseInt(flowDataId)
            );
            if (response && response.data) {
                this.setState({ selectedFlowData: response.data });
            }
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    componentDidMount() {
        this.getFlowDataList();
        // Se já existe um flowData selecionado válido, buscar seus detalhes
        const currentFlowDataId = this.props.flowCard.button?.value;
        if (
            currentFlowDataId &&
            currentFlowDataId !== '' &&
            currentFlowDataId !== null &&
            currentFlowDataId !== undefined
        ) {
            this.getFlowDataById(currentFlowDataId);
        }
    }

    onChange = (values: IResponseElementWhatsappFlow, isValid: boolean) => {
        this.props.onChange(values, isValid);
    };

    renderForm = () => {
        const { getTranslation } = this.props;
        return (
            <Formik
                initialValues={
                    {
                        ...this.props.flowCard,
                        data: this.props.flowCard.data || {},
                        button: {
                            type: 'flow',
                            title: this.props.flowCard.button?.title || '',
                            value: this.props.flowCard.button?.value || undefined,
                        },
                    } as IResponseElementWhatsappFlow
                }
                onSubmit={() => {}}
                validationSchema={this.getValidationSchema()}
                render={({
                    submitForm,
                    values,
                    setValues,
                    setFieldValue,
                    setFieldTouched,
                    validateForm,
                    errors,
                    touched,
                }) => {
                    const submit = () => {
                        validateForm()
                            .then((validatedValues: any) => {
                                if (validatedValues.isCanceled) {
                                    submit();
                                    return;
                                }

                                if (Object.keys(validatedValues).length !== 0) {
                                    this.onChange(values, false);
                                } else {
                                    this.onChange(values, true);
                                }
                                submitForm();
                            })
                            .catch((e) => dispatchSentryError(e));
                    };

                    return (
                        <StyledForm>
                            <LabelWrapper
                                validate={{
                                    errors,
                                    touched,
                                    fieldName: 'title',
                                    isSubmitted: this.props.isSubmitted,
                                }}
                            >
                                <Input
                                    name='title'
                                    placeholder={getTranslation('Título')}
                                    maxLength={60}
                                    showCount
                                    value={values.title || ''}
                                    onChange={(e) => {
                                        setFieldValue('title', e.target.value);
                                        submit();
                                    }}
                                    onBlur={submit}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                validate={{
                                    errors,
                                    touched,
                                    fieldName: 'text',
                                    isSubmitted: this.props.isSubmitted,
                                }}
                            >
                                <Input.TextArea
                                    name='text'
                                    placeholder={getTranslation('Texto')}
                                    maxLength={1024}
                                    showCount
                                    value={values.text || ''}
                                    onChange={(e) => {
                                        setFieldValue('text', e.target.value);
                                        submit();
                                    }}
                                    onBlur={submit}
                                    autoSize={{ minRows: 3, maxRows: 6 }}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                validate={{
                                    errors,
                                    touched,
                                    fieldName: 'footer',
                                    isSubmitted: this.props.isSubmitted,
                                }}
                            >
                                <Input
                                    name='footer'
                                    placeholder={getTranslation('Rodapé')}
                                    maxLength={60}
                                    showCount
                                    value={values.footer || ''}
                                    onChange={(e) => {
                                        setFieldValue('footer', e.target.value);
                                        submit();
                                    }}
                                    onBlur={() => {}}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                validate={{
                                    errors,
                                    touched,
                                    fieldName: 'button.title',
                                    isSubmitted: this.props.isSubmitted,
                                }}
                            >
                                <Input
                                    name='button.title'
                                    placeholder={getTranslation('Título do botão')}
                                    maxLength={20}
                                    showCount
                                    value={values.button?.title || ''}
                                    onChange={(e) => {
                                        const button: IButtonFlow = {
                                            type: 'flow',
                                            title: e.target.value,
                                            value: values.button?.value || '',
                                        };
                                        setFieldValue('button', button);
                                        submit();
                                    }}
                                    onBlur={submit}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                validate={{
                                    errors,
                                    touched,
                                    fieldName: 'button.value',
                                    isSubmitted: this.props.isSubmitted,
                                }}
                            >
                                <Select
                                    placeholder={getTranslation('Selecionar FlowData')}
                                    value={values.button?.value}
                                    onChange={(value) => {
                                        const button: IButtonFlow = {
                                            type: 'flow',
                                            title: values.button?.title || '',
                                            value: value,
                                        };
                                        setFieldValue('button', button);
                                        this.getFlowDataById(value);
                                        submit();
                                    }}
                                    onBlur={submit}
                                    style={{ width: '100%' }}
                                >
                                    {this.state.flowDataList.map((flowData) => (
                                        <Select.Option key={flowData.id} value={flowData.id}>
                                            {flowData.name || flowData.id}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </LabelWrapper>

                            {this.state.selectedFlowData && this.state.selectedFlowData.data && (
                                <Card
                                    size='small'
                                    style={{
                                        marginTop: '8px',
                                        width: '100%',
                                        maxWidth: '100%',
                                        backgroundColor: '#f8f9fa',
                                        border: '1px solid #e9ecef',
                                    }}
                                    title={
                                        <div>
                                            <Typography.Title
                                                level={5}
                                                style={{ margin: 0, color: '#495057', marginBottom: '4px' }}
                                            >
                                                📝 {getTranslation('Configuração de Dados do Flow')}
                                            </Typography.Title>
                                            <Typography.Text
                                                type='secondary'
                                                style={{ fontSize: '12px', fontStyle: 'italic' }}
                                            >
                                                {getTranslation(
                                                    'Campos opcionais - Preencha apenas os campos necessários'
                                                )}
                                            </Typography.Text>
                                        </div>
                                    }
                                >
                                    {Object.keys(this.state.selectedFlowData.data).map((key) => (
                                        <this.WrapperFieldDataAttr
                                            key={key}
                                            values={values}
                                            setValues={setValues}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            touched={touched}
                                            errors={errors}
                                            fieldName={key}
                                            fieldTitle={key}
                                        />
                                    ))}
                                    {Object.keys(this.state.selectedFlowData.data).length === 0 && (
                                        <Typography.Text type='secondary' style={{ fontStyle: 'italic' }}>
                                            {getTranslation('Este flow não possui campos de dados configuráveis')}
                                        </Typography.Text>
                                    )}
                                </Card>
                            )}

                            {this.state.selectedFlowData && this.state.selectedFlowData.flow?.flowFields && (
                                <Card
                                    size='small'
                                    style={{
                                        marginTop: '8px',
                                        width: '100%',
                                        maxWidth: '100%',
                                        backgroundColor: '#f8f9fa',
                                        border: '1px solid #e9ecef',
                                    }}
                                    title={
                                        <div>
                                            <Typography.Title
                                                level={5}
                                                style={{ margin: 0, color: '#495057', marginBottom: '4px' }}
                                            >
                                                📝{' '}
                                                {getTranslation('Configuração de preenchimento das resposta do Flow')}
                                            </Typography.Title>
                                            <Typography.Text
                                                type='secondary'
                                                style={{ fontSize: '12px', fontStyle: 'italic' }}
                                            >
                                                {getTranslation(
                                                    'Campos opcionais - Preencha apenas os campos necessários'
                                                )}
                                            </Typography.Text>
                                        </div>
                                    }
                                >
                                    {this.state.selectedFlowData.flow?.flowFields?.pages.map((page) => {
                                        return page?.fields.map((field) => {
                                            if (!field?.name) return null;

                                            return (
                                                <this.WrapperFieldAttr
                                                    key={field.name}
                                                    values={values}
                                                    setValues={setValues}
                                                    setFieldTouched={setFieldTouched}
                                                    setFieldValue={setFieldValue}
                                                    submit={submit}
                                                    touched={touched}
                                                    errors={errors}
                                                    fieldName={field.name}
                                                    fieldTitle={field?.label || field.name}
                                                />
                                            );
                                        })
                                    })}
                                </Card>
                            )}
                        </StyledForm>
                    );
                }}
            />
        );
    };

    render() {
        return <CardWrapper className='card'>{this.renderForm()}</CardWrapper>;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    botAttributes: ownProps.botAttributes || state.botReducer.botAttributes || state.botReducer.attributeList || [],
});

export const FlowCard = I18n(connect(mapStateToProps, {})(FlowCardClass));
