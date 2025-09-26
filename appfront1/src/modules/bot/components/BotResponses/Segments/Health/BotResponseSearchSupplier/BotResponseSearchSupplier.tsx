import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { withRouter } from 'react-router';
import { BotResponseSearchSupplierProps } from './BotResponseSearchSupplierProps';
import styled from 'styled-components';
import { LabelWrapper } from '../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { v4 } from 'uuid';
import { IResponseElementQRBuscaFornecedor } from 'kissbot-core';
import { InteractionSelect } from '../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { dispatchSentryError } from '../../../../../../../utils/Sentry';
import { FormItemInteraction } from '../../../../../../../shared-v2/FormItemInteraction';

const Row = styled("div")`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const Col50 = styled("div")`
    width: 50%;
    display: flex;
`;

const Col100 = styled("div")`
    width: 100%;
    display: flex;
`;

const WrapperValueRight = styled("div")`
    padding-right: 6px;
    width:100%;
`;

const WrapperValueLeft = styled("div")`
    padding-left: 6px;
    width:100%;
`;

class BotResponseSearchSupplierClass extends Component<BotResponseSearchSupplierProps> {
    constructor(props: Readonly<BotResponseSearchSupplierProps>) {
        super(props);
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            cnpjAttr: Yup.string().required('Campo obrigatório'),
            panelId: Yup.string().required('Campo obrigatório'),
            serviceAddress: Yup.string().required('Campo obrigatório')
                .matches(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\/\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/, 'This field must be valid url'),
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    getInitialValues = () => {
        const element: IResponseElementQRBuscaFornecedor = this.props.response.elements[0];

        if (!element.serviceAddress) {
            element.serviceAddress = '';
        }
        if (!element.isEmptyGoto) {
            element.isEmptyGoto = '';
        }
        return element;
    }

    render() {
        return <Formik
            initialValues={{ ...this.getInitialValues() }}
            onSubmit={() => { }}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, validateForm, setFieldValue, touched, errors, setFieldTouched }) => {
                const submit = () => {
                    validateForm().then((validatedValues: any) => {
                        if (validatedValues.isCanceled) {
                            submit();
                            return;
                        }
                        if (Object.keys(validatedValues).length != 0) {
                            this.onChange(values, false);
                        } else {
                            this.onChange(values, true);
                        }
                        submitForm();
                    }).catch(e => dispatchSentryError(e))
                };
                return <Form>
                    <Row>
                        <Col100>
                            <LabelWrapper validate={{
                                touched, errors,
                                isSubmitted: this.props.submitted,
                                fieldName: `serviceAddress`
                            }}
                                label="Endereço do serviço"
                                tooltip="Endereço do serviço">
                                <StyledFormikField
                                    onBlur={() => submit()}
                                    name={`serviceAddress`}
                                    placeholder='Endereço do serviço' />
                            </LabelWrapper>
                        </Col100>
                    </Row>
                    <Row>
                        <Col50>
                            <WrapperValueRight>
                                <LabelWrapper validate={{
                                    touched, errors,
                                    isSubmitted: this.props.submitted,
                                    fieldName: `panelId`
                                }}
                                    label="Id do painel"
                                    tooltip="Id do painel">
                                    <StyledFormikField
                                        onBlur={() => submit()}
                                        name={`panelId`}
                                        placeholder="Id do painel" />
                                </LabelWrapper>
                            </WrapperValueRight>
                        </Col50>
                        <Col50>
                            <WrapperValueLeft>
                                <LabelWrapper
                                    label="Atributo id do processo"
                                    validate={{
                                        touched, errors,
                                        fieldName: "idProcessoAttr",
                                        isSubmitted: this.props.submitted
                                    }}
                                    tooltip="Atributo id do processo"
                                >
                                    <StyledFormikField name="idProcessoAttr"
                                        component="select"
                                        onChange={(ev) => {
                                            setFieldValue(`idProcessoAttr`, ev.target.value);
                                        }}
                                        onBlur={submit}
                                        style={{ width: "100%" }}>
                                        <option value=''></option>
                                        {this.props.botAttributes
                                            .filter(i => i.botId || i.fromEntity)
                                            .map(element =>
                                                <option value={element.name} key={v4()}>{element.name}</option>
                                            )}
                                    </StyledFormikField>
                                </LabelWrapper>
                            </WrapperValueLeft>
                        </Col50>
                    </Row>
                    <Row>
                        <Col50>
                            <WrapperValueRight>
                                <LabelWrapper
                                    label="Atributo Cnpj"
                                    validate={{
                                        touched, errors,
                                        fieldName: "cnpjAttr",
                                        isSubmitted: this.props.submitted
                                    }}
                                    tooltip="Atributo do CNPJ"
                                >
                                    <StyledFormikField name="cnpjAttr"
                                        component="select"
                                        onChange={(ev) => {
                                            setFieldValue(`cnpjAttr`, ev.target.value);
                                        }}
                                        onBlur={submit}
                                        style={{ width: "100%" }}>
                                        <option value=''></option>
                                        {this.props.botAttributes.filter(i => i.botId || i.fromEntity).map(element =>
                                            <option value={element.name} key={v4()}>{element.name}</option>
                                        )}
                                    </StyledFormikField>
                                </LabelWrapper>
                            </WrapperValueRight>
                        </Col50>
                        <Col50></Col50>
                    </Row>
                    <Row>
                        <FormItemInteraction
                            interaction={values.isEmptyGoto}
                            label="Interação"
                            validate={{
                                touched, errors,
                                fieldName: `isEmptyGoto`,
                                isSubmitted: this.props.submitted
                            }}
                            tooltip="Envia para outra interação caso a consulta não retorne nenhum resultado (opcional)"
                        >
                            <InteractionSelect
                                name="isEmptyGoto"
                                options={this.props.interactionList}
                                placeholder={'Selecione uma interação'}
                                style={{ width: "100%" }}
                                interactionTypeToShow={['interaction']}
                                defaultValue={values.isEmptyGoto}
                                onChange={(ev) => {
                                    setFieldTouched('isEmptyGoto');
                                    if (!ev) return;
                                    values.isEmptyGoto = ev.value;
                                    setFieldValue('isEmptyGoto', ev.value);
                                    submit();
                                }}
                            />
                        </FormItemInteraction>
                    </Row>
                </Form>
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    botAttributes: state.botReducer.botAttributes,
    interactionList: state.botReducer.interactionList,
});

export const BotResponseSearchSupplier = withRouter(connect(
    mapStateToProps,
    {}
)(BotResponseSearchSupplierClass));