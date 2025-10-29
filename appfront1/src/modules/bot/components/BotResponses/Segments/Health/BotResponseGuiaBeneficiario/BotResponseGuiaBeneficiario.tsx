import React, { Component } from 'react';
import { connect } from 'react-redux';
import { BotResponseGuiaBeneficiarioProps } from './BotResponseGuiaBeneficiarioProps';
import * as Yup from 'yup';
import { Formik, Form, FieldArray } from 'formik';
import { LabelWrapper } from '../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { CustomCreatableSelect } from '../../../../../../../shared/StyledForms/CustomCreatableSelect/CustomCreatableSelect';
import styled from 'styled-components';
import { withRouter } from 'react-router';
import { Interaction } from '../../../../../../../model/Interaction';
import { InteractionType } from 'kissbot-core';
import { EntityActions } from '../../../../../../entity/redux/actions';
import { BotAttrs } from '../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import { InteractionSelect } from '../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { dispatchSentryError } from '../../../../../../../utils/Sentry';
import { FormItemInteraction } from '../../../../../../../shared-v2/FormItemInteraction';

const CenterDiv = styled('div')`
    width: 100%;
    display: flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding: 8px 0;
    margin: 7px 0;
    border-bottom: 1px #dcdcdc solid;
`;

const Row = styled('div')`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const Col50 = styled('div')`
    width: 50%;
    align-items: center;
    justify-content: center;
    display: flex;
`;

const WrapperValueRight = styled('div')`
    padding-right: 6px;
    width: 100%;
`;

const WrapperValueLeft = styled('div')`
    padding-left: 6px;
    width: 100%;
`;

class BotResponseGuiaBeneficiarioClass extends Component<BotResponseGuiaBeneficiarioProps> {
    constructor(props: Readonly<BotResponseGuiaBeneficiarioProps>) {
        super(props);
    }
    status: string[] = [
        'CAPTURADA',
        'NEGADO',
        'AGUARDANDO_RETORNO',
        'AGUARDANDO_JUSTIFICATIVA',
        'EM_ANALISE',
        'AUTORIZADO_PARCIALMENTE',
        'AGUARDANDO_DOCUMENTACAO',
        'PERICIA',
        'CANCELADA',
        'EXECUTADA',
        'AUTORIZADO',
    ];

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            medicalPlan: Yup.string().required('Campo obrigatório'),
            isEmptyGoto: Yup.string().required('Campo obrigatório'),
            beneficiarioNumber: Yup.string().required('Campo obrigatório'),
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    getInteractions = (interactions: Interaction[]) => {
        return interactions.filter((e) => e.type === InteractionType.interaction);
    };

    render() {
        return (
            <Formik
                initialValues={{
                    ...this.props.response.elements[0],
                }}
                onSubmit={() => {}}
                validationSchema={this.getValidationSchema()}
                render={({
                    values,
                    submitForm,
                    validateForm,
                    setFieldValue,
                    touched,
                    errors,
                    setFieldTouched,
                    handleChange,
                }) => {
                    const submit = () => {
                        validateForm()
                            .then((validatedValues: any) => {
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
                            })
                            .catch((e) => dispatchSentryError(e));
                    };
                    return (
                        <Form>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <LabelWrapper
                                            label='Plano médico'
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'medicalPlan',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip='Tipo do plano médico'
                                        >
                                            <CustomCreatableSelect
                                                options={[{ value: 'sc_saude', label: 'sc saúde' }]}
                                                value={{
                                                    value: values.medicalPlan ? values.medicalPlan : '',
                                                    label: values.medicalPlan ? values.medicalPlan : '',
                                                }}
                                                placeholder='Plano médico'
                                                onChange={(event) => {
                                                    setFieldTouched('medicalPlan');
                                                    values.medicalPlan = (event && event.value) || '';
                                                    setFieldValue('medicalPlan', (event && event.value) || '');
                                                    submit();
                                                }}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <LabelWrapper
                                            label='Atributo da guia'
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'beneficiarioNumber',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip='Atributo da guia'
                                        >
                                            <BotAttrs
                                                value={{
                                                    value: values.beneficiarioNumber ? values.beneficiarioNumber : '',
                                                    label: values.beneficiarioNumber ? values.beneficiarioNumber : '',
                                                }}
                                                onCreateOption={(event) => {
                                                    setFieldTouched('beneficiarioNumber');
                                                    values.beneficiarioNumber = event;
                                                    setFieldValue('beneficiarioNumber', event);
                                                    submit();
                                                }}
                                                onChange={(event) => {
                                                    setFieldTouched('beneficiarioNumber');
                                                    values.beneficiarioNumber = event.value;
                                                    setFieldValue('beneficiarioNumber', event.value);
                                                    submit();
                                                }}
                                                showOnly={['entity', 'others']}
                                                creatable
                                            />
                                        </LabelWrapper>
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <CenterDiv>
                                Se a guia não for encontrada, a conversa poderá ser redirecionada para outro bot ou
                                interação.
                            </CenterDiv>
                            <FieldArray
                                name='isEmptyGoto'
                                render={() => {
                                    return (
                                        <>
                                            <FormItemInteraction
                                                interaction={values.isEmptyGoto}
                                                label='Interação'
                                                validate={{
                                                    touched,
                                                    errors,
                                                    fieldName: `isEmptyGoto`,
                                                    isSubmitted: this.props.submitted,
                                                }}
                                                tooltip='Interação'
                                            >
                                                <InteractionSelect
                                                    name='isEmptyGoto'
                                                    options={this.props.interactionList}
                                                    interactionTypeToShow={['interaction']}
                                                    defaultValue={values.isEmptyGoto}
                                                    placeholder={'Selecione uma interação'}
                                                    style={{ width: '100%' }}
                                                    onChange={(ev) => {
                                                        setFieldTouched('isEmptyGoto');
                                                        if (!ev) return;
                                                        values.isEmptyGoto = ev.value;
                                                        setFieldValue('isEmptyGoto', ev.value);
                                                        submit();
                                                    }}
                                                />
                                            </FormItemInteraction>
                                        </>
                                    );
                                }}
                            ></FieldArray>
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    entitiesList: state.entityReducer.entitiesList,
    botAttributes: state.botReducer.botAttributes,
    interactionList: state.botReducer.interactionList,
});

export const BotResponseGuiaBeneficiario = withRouter(
    connect(mapStateToProps, {
        setCurrentEntities: EntityActions.setCurrentEntities,
    })(BotResponseGuiaBeneficiarioClass)
);
