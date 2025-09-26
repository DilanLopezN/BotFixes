import React, { Component } from 'react'
import { connect } from 'react-redux'
import { BotResponseStatusGuideProps } from './BotResponseStatusGuideProps';
import * as Yup from 'yup';
import { Formik, Form, FieldArray } from 'formik';
import { LabelWrapper } from '../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { CustomCreatableSelect } from '../../../../../../../shared/StyledForms/CustomCreatableSelect/CustomCreatableSelect';
import { StyledFormikField } from '../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import styled from 'styled-components';
import { AddBtn } from '../../../../../../../shared/StyledForms/AddBtn/AddBtn';
import { FieldAttributes } from '../../../../../../../shared/StyledForms/FieldAttributes/FieldAttributes/FieldAttributes';
import { DeleteBtn } from '../../../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';
import { withRouter } from 'react-router';
import { Interaction } from '../../../../../../../model/Interaction';
import { InteractionType } from 'kissbot-core';
import { EntityActions } from '../../../../../../entity/redux/actions';
import ButtonSelect from '../../../../../../../shared/StyledForms/ButtonSelect/ButtonSelect';
import { BotAttrs } from '../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import { InteractionSelect } from '../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { dispatchSentryError } from '../../../../../../../utils/Sentry';
import { FormItemInteraction } from '../../../../../../../shared-v2/FormItemInteraction';

const CenterDiv = styled("div")`
    width: 100%;
    display:flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding: 8px 0;
    margin: 7px 0;
`;

const StatusBtn = styled("div")`
    margin-left: 5px;
`;

const Row = styled("div")`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const Col50 = styled("div")`
    width: 50%;
    align-items: center;
    justify-content: center;
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

const DeleteItem = styled(DeleteBtn)`
    position: absolute;
    right: 3px;
    top: 37px;
`;

const Col60 = styled("div")`
    width: 60%;
    justify-content: center;
    display: flex;
`;

const Col40 = styled("div")`
    width: 40%;
    justify-content: center;
    display: flex;
`;

class BotResponseStatusGuideClass extends Component<BotResponseStatusGuideProps> {
    constructor(props: Readonly<BotResponseStatusGuideProps>) {
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
            guideStatus: Yup.array().of(
                Yup.object().shape({
                    case: Yup.string().required("Campo obrigatório"),
                    text: Yup.array().of(Yup.string()
                        .required()).min(1, 'Necessário ao menos um caractere.')
                })
            ).min(1, 'Necessário ao menos uma entrada.'),
            isEmptyGoto: Yup.string().required('Campo obrigatório '),
            guideNumber: Yup.string().required('Campo obrigatório'),
            guideNumberType: Yup.string().required('Campo obrigatório'),
            shouldReturnBeneficiarioNumber: Yup.boolean().required(),
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    getInteractions = (interactions: Interaction[]) => {
        return interactions.filter(e => e.type === InteractionType.interaction);
    }

    initialValues = () => {
        const { elements } = this.props.response;
        if (elements[0] && elements[0].shouldReturnBeneficiarioNumber === undefined) {
            elements[0].shouldReturnBeneficiarioNumber = false;
        }
        return this.props.response.elements[0];
    }

    render() {
        return <Formik
            initialValues={{
                ...this.initialValues(),
            }}
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
                    <LabelWrapper
                        label="Plano médico"
                        validate={{
                            touched, errors,
                            fieldName: "medicalPlan",
                            isSubmitted: this.props.submitted
                        }}
                        tooltip="Tipo do plano médico"
                    >
                        <CustomCreatableSelect
                            options={[{ value: 'sc_saude', label: 'sc saúde' }]}
                            value={{
                                value: values.medicalPlan ? values.medicalPlan : '',
                                label: values.medicalPlan ? values.medicalPlan : ''
                            }}
                            placeholder="Plano médico"
                            onChange={(event) => {
                                setFieldTouched('medicalPlan');
                                if (!event || !event.value) return;
                                values.medicalPlan = event.value;
                                setFieldValue('medicalPlan', event.value);
                                submit();
                            }}
                        />
                    </LabelWrapper>
                    <Row>
                        <Col50>
                            <WrapperValueRight>
                                <LabelWrapper
                                    label="Atributo da guia"
                                    validate={{
                                        touched, errors,
                                        fieldName: "guideNumber",
                                        isSubmitted: this.props.submitted
                                    }}
                                    tooltip="Atributo da guia"
                                >
                                    <BotAttrs
                                        value={{
                                            value: values.guideNumber ? values.guideNumber : '',
                                            label: values.guideNumber ? values.guideNumber : ''
                                        }}
                                        onCreateOption={event => {
                                            setFieldTouched('guideNumber');
                                            values.guideNumber = event;
                                            setFieldValue('guideNumber', event);
                                            submit();
                                        }}
                                        onChange={event => {
                                            setFieldTouched('guideNumber');
                                            if (!event || !event.value) return;
                                            values.guideNumber = event.value;
                                            setFieldValue('guideNumber', event.value);
                                            submit();
                                        }}
                                        showOnly={['others']}
                                        creatable
                                    />
                                </LabelWrapper>
                            </WrapperValueRight>
                        </Col50>
                        <Col50>
                            <WrapperValueLeft>
                                <LabelWrapper
                                    label="Exibe o número do benefíciario"
                                    validate={{
                                        touched, errors,
                                        fieldName: "shouldReturnBeneficiarioNumber",
                                        isSubmitted: this.props.submitted
                                    }}
                                    tooltip="Exibe o número do benefíciario"
                                >
                                    <ButtonSelect
                                        onChange={(ev) => {
                                            values.shouldReturnBeneficiarioNumber = ev;
                                            setFieldValue('shouldReturnBeneficiarioNumber', ev);
                                            submit();
                                        }}
                                        value={values.shouldReturnBeneficiarioNumber}
                                        options={[{ label: true }, { label: false }]}
                                    />
                                </LabelWrapper>
                            </WrapperValueLeft>
                        </Col50>
                    </Row>
                    <CenterDiv>
                        Mensagem que será enviada ao usuário, dependendo do status da guia.
                    </CenterDiv>
                    <hr />
                    {
                        values.guideStatus.map((condition, indexStatus: number) => <Row key={indexStatus}>
                            <div className="col-5 p-0">
                                <WrapperValueRight>
                                    <LabelWrapper
                                        label="Status da guia"
                                        validate={{
                                            touched, errors,
                                            fieldName: `guideStatus[${indexStatus}].case`,
                                            isSubmitted: this.props.submitted
                                        }}
                                        tooltip="Status da guia"
                                    >
                                        <CustomCreatableSelect
                                            options={this.status.map((e) => {
                                                return { value: e, label: e };
                                            })}
                                            value={{
                                                value: values.guideStatus[`${indexStatus}`].case ? values.guideStatus[`${indexStatus}`].case : '',
                                                label: values.guideStatus[`${indexStatus}`].case ? values.guideStatus[`${indexStatus}`].case : ''
                                            }}
                                            placeholder="Status da guia"
                                            onChange={(event) => {
                                                setFieldTouched(`guideStatus[${indexStatus}].case`);
                                                if (!event || !event.value) return;
                                                values.guideStatus[`${indexStatus}`].case = event.value;
                                                setFieldValue(`guideStatus[${indexStatus}].case`, event.value);
                                                submit();
                                            }}
                                        />
                                    </LabelWrapper>
                                </WrapperValueRight>
                            </div>
                            <div className="col-7 p-0">
                                <WrapperValueLeft>
                                    <FieldArray
                                        name="guideStatus"
                                        render={() => {
                                            {
                                                return condition.text.map((text: string, indexText: number) =>
                                                    <Row key={indexText}>
                                                        <div className="col-11 p-0">
                                                            <LabelWrapper
                                                                label={`Texto (${indexText + 1})`}
                                                                validate={{
                                                                    touched, errors,
                                                                    fieldName: `guideStatus[${indexStatus}].text[${indexText}]`,
                                                                    isSubmitted: this.props.submitted
                                                                }}
                                                                tooltip="Envia um texto aleatório para o usuário"
                                                            >    <FieldAttributes value={text} type="SELECT"
                                                                onChange={(data) => {
                                                                    setFieldValue(`guideStatus[${indexStatus}].text[${indexText}]`, data);
                                                                    submit();
                                                                }} />
                                                            </LabelWrapper>
                                                            {indexText === 0 || indexText > 0
                                                                ? <DeleteItem onClick={() => {
                                                                    if (indexStatus > 0) {
                                                                        values.guideStatus.splice(indexStatus, 1);
                                                                    } else if (indexStatus === 0 && indexText === 0) {
                                                                        return;
                                                                    } else if (indexStatus === 0 && indexText > 0) {
                                                                        values.guideStatus[indexStatus].text.splice(indexText, 1);
                                                                    }
                                                                    submit();
                                                                }} />
                                                                : null}
                                                        </div>
                                                        <div className="col-1 p-0 d-flex align-items-center justify-content-center">
                                                            <LabelWrapper
                                                                label="Add"
                                                            >
                                                                <AddBtn onClick={() => {
                                                                    values.guideStatus[indexStatus].text.push('');
                                                                    submit();
                                                                }} />
                                                            </LabelWrapper>

                                                        </div>
                                                    </Row>
                                                )
                                            }
                                        }}></FieldArray>
                                </WrapperValueLeft>
                            </div>
                        </Row>
                        )
                    }
                    <br />
                    <Row>
                        <Col50>
                            <AddBtn onClick={() => {
                                values.guideStatus.push({ case: "", text: [""] });
                                submit();
                            }} />
                            <StatusBtn>Adicionar status</StatusBtn>
                        </Col50>
                    </Row>
                    <CenterDiv>
                        Se a guia não for encontrada, a conversa poderá ser redirecionada para outro bot ou interação.
                    </CenterDiv>
                    <hr />
                    <FieldArray
                        name="isEmptyGoto"
                        render={() => {
                            return <>
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
                                        interactionTypeToShow={['interaction']}
                                        style={{ width: "100%" }}
                                        defaultValue={values.isEmptyGoto}
                                        onChange={event => {
                                            setFieldTouched('isEmptyGoto');
                                            if (!event || !event.value) return;
                                            values.isEmptyGoto = event.value;
                                            setFieldValue('isEmptyGoto', event.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </>
                        }} ></FieldArray>
                </Form >
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    entitiesList: state.entityReducer.entitiesList,
    botAttributes: state.botReducer.botAttributes,
    interactionList: state.botReducer.interactionList,
});

export const BotResponseStatusGuide = withRouter(connect(
    mapStateToProps,
    {
        setCurrentEntities: EntityActions.setCurrentEntities,
    }
)(BotResponseStatusGuideClass));