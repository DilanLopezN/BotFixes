import React, { Component } from 'react'
import { connect } from 'react-redux'
import { BotResponseMedicalGuideProps, BotResponseMedicalGuideState } from './BotResponseMedicalGuideProps';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import styled from 'styled-components';
import { LabelWrapper } from '../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { CustomCreatableSelect } from '../../../../../../../shared/StyledForms/CustomCreatableSelect/CustomCreatableSelect';
import { Entity, InteractionType } from 'kissbot-core';
import { EntityService } from '../../../../../../entity/services/EntityService';
import { withRouter } from 'react-router';
import { EntityActions } from '../../../../../../entity/redux/actions';
import { StyledFormikField } from '../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { BotService } from '../../../../../services/BotService';
import { Interaction } from '../../../../../../../model/Interaction';
import { AddBtn } from '../../../../../../../shared/StyledForms/AddBtn/AddBtn';
import { DeleteBtn } from '../../../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';
import isArray from 'lodash/isArray';
import ButtonSelect from '../../../../../../../shared/StyledForms/ButtonSelect/ButtonSelect';
import { BotAttrs } from '../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import { PaginatedModel } from '../../../../../../../model/PaginatedModel';
import { InteractionSelect } from '../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { dispatchSentryError } from '../../../../../../../utils/Sentry';
import { FormItemInteraction } from '../../../../../../../shared-v2/FormItemInteraction';

const Row = styled("div")`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const CenterDiv = styled("div")`
    width: 100%;
    display:flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding: 8px 0;
    margin: 7px 0;
`;

const Col33 = styled("div")`
    width: 33%;
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
    top: 6px;
`;

const Space = styled("div")`
    height: 1px;
    background: #ccc;
    margin: 10px 0;
`;

class BotResponseMedicalGuideClass extends Component<BotResponseMedicalGuideProps, BotResponseMedicalGuideState> {
    constructor(props: Readonly<BotResponseMedicalGuideProps>) {
        super(props);
        this.state = {
            botLoaded: this.props.match.params.botId,
            interactionList: [],
            loadedInteractions: false,
        }
        this.loadInteractions();
        this.getListEntity();
    }

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    onChangeBot = (botId: string) => {
        this.getInteractionsList(botId);
    }

    loadInteractions = () => {
        this.getInteractionsList(this.state.botLoaded);
    }

    getInteractionsList = (botId: string) => {
        BotService.getInteractions(this.props.match.params.workspaceId, botId)
            .then(success => {
                this.setState({  interactionList: this.getInteractions(success.data), loadedInteractions: true });
            })
    }

    getInteractions = (interactions: Interaction[]) => {
        return interactions.filter(e => e.type === InteractionType.interaction || e.type === InteractionType.fallback);
    }

    private getListEntity = async () => {
        const listEntity: PaginatedModel<Entity> = await EntityService.getEntityList(this.props.match.params.workspaceId);
        this.props.setCurrentEntities(listEntity ? listEntity.data : [])
    };

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            limit: Yup.number()
                .required('Campo obrigatório'),
            random: Yup.boolean(),
            healthPlan: Yup.string().required('Campo obrigatório'),
            isEmptyGoto: Yup.string(),
            successMessage: Yup.array().of(Yup.string().required("Campo obrigatório")),
            shouldReturnCnpj: Yup.boolean().required(),
            rules: Yup.array().of(
                Yup.object().shape({
                    name: Yup.string(),
                    value: Yup.string(),
                })
            ),
        });
    };

    initialValues = () => {
        const { elements } = this.props.response;
        if (elements[0] && elements[0].shouldReturnCnpj === undefined) {
            elements[0].shouldReturnCnpj = false;
        }
        if (elements[0] && elements[0].rules === undefined) {
            elements[0].rules = [{
                name: '',
                value: '',
            }];
        }
        if (elements[0] && elements[0].specializedServiceAttribute === undefined) {
            elements[0].specializedServiceAttribute = '';
        }
        if (elements[0] && elements[0].serviceCodeAttribute === undefined) {
            elements[0].serviceCodeAttribute = '';
        }
        if (elements[0] && elements[0].providerAttribute === undefined) {
            elements[0].providerAttribute = '';
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
            render={({ values, submitForm, validateForm, setFieldValue, touched, errors, setFieldTouched, handleChange }) => {
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
                            fieldName: "healthPlan",
                            isSubmitted: this.props.submitted
                        }}
                        tooltip="Define o tipo do plano médico"
                    >
                        <CustomCreatableSelect
                            options={[{ value: 'sc_saude', label: 'sc saúde' }]}
                            value={{
                                value: values.healthPlan ? values.healthPlan : '',
                                label: values.healthPlan ? values.healthPlan : ''
                            }}
                            placeholder="Plano médico"
                            onChange={(event) => {
                                setFieldTouched('healthPlan');
                                values.healthPlan = event && event.value || '';
                                setFieldValue('healthPlan', event && event.value || '');
                                submit();
                            }}
                        />
                    </LabelWrapper>
                    <Row>
                        <LabelWrapper
                            label="Especialidade"
                            validate={{
                                touched, errors,
                                fieldName: "specialityAttribute",
                                isSubmitted: this.props.submitted
                            }}
                            tooltip="Atributo da especialidade"
                        >
                            <BotAttrs
                                value={{
                                    value: values.specialityAttribute ? values.specialityAttribute : '',
                                    label: values.specialityAttribute ? values.specialityAttribute : ''
                                }}
                                onCreateOption={event => {
                                    setFieldTouched('specialityAttribute');
                                    values.specialityAttribute = event;
                                    setFieldValue('specialityAttribute', event);
                                    submit();
                                }}
                                onChange={event => {
                                    setFieldTouched('specialityAttribute');
                                    values.specialityAttribute = event.value;
                                    setFieldValue('specialityAttribute', event.value);
                                    submit();
                                }}
                                showOnly={['entity', 'others']}
                                creatable
                            />
                        </LabelWrapper>
                        <LabelWrapper
                            label="Cidade"
                            validate={{
                                touched, errors,
                                fieldName: "cityAttribute",
                                isSubmitted: this.props.submitted
                            }}
                            tooltip="Atributo da cidade"
                        >
                            <BotAttrs
                                value={{
                                    value: values.cityAttribute ? values.cityAttribute : '',
                                    label: values.cityAttribute ? values.cityAttribute : ''
                                }}
                                onCreateOption={event => {
                                    setFieldTouched('cityAttribute');
                                    values.cityAttribute = event;
                                    setFieldValue('cityAttribute', event);
                                    submit();
                                }}
                                onChange={event => {
                                    setFieldTouched('cityAttribute');
                                    values.cityAttribute = event.value;
                                    setFieldValue('cityAttribute', event.value);
                                    submit();
                                }}
                                showOnly={['entity', 'others']}
                                creatable
                            />
                        </LabelWrapper>
                    </Row>
                    <Row>
                        <LabelWrapper
                            label="Serviço especializado"
                            validate={{
                                touched, errors,
                                fieldName: "specializedServiceAttribute",
                                isSubmitted: this.props.submitted
                            }}
                            tooltip="Atributo do serviço especializado"
                        >
                            <BotAttrs
                                value={{
                                    value: values.specializedServiceAttribute ? values.specializedServiceAttribute : '',
                                    label: values.specializedServiceAttribute ? values.specializedServiceAttribute : ''
                                }}
                                onCreateOption={event => {
                                    setFieldTouched('specializedServiceAttribute');
                                    values.specializedServiceAttribute = event;
                                    setFieldValue('specializedServiceAttribute', event);
                                    submit();
                                }}
                                onChange={event => {
                                    setFieldTouched('specializedServiceAttribute');
                                    values.specializedServiceAttribute = event.value;
                                    setFieldValue('specializedServiceAttribute', event.value);
                                    submit();
                                }}
                                showOnly={['entity', 'others']}
                                creatable
                            />
                        </LabelWrapper>
                        <LabelWrapper
                            label="Código de serviço"
                            validate={{
                                touched, errors,
                                fieldName: "serviceCodeAttribute",
                                isSubmitted: this.props.submitted
                            }}
                            tooltip="Atributo do código de serviço"
                        >
                            <BotAttrs
                                value={{
                                    value: values.serviceCodeAttribute ? values.serviceCodeAttribute : '',
                                    label: values.serviceCodeAttribute ? values.serviceCodeAttribute : ''
                                }}
                                onCreateOption={event => {
                                    setFieldTouched('serviceCodeAttribute');
                                    values.serviceCodeAttribute = event;
                                    setFieldValue('serviceCodeAttribute', event);
                                    submit();
                                }}
                                onChange={event => {
                                    setFieldTouched('serviceCodeAttribute');
                                    values.serviceCodeAttribute = event.value;
                                    setFieldValue('serviceCodeAttribute', event.value);
                                    submit();
                                }}
                                showOnly={['entity', 'others']}
                                creatable
                            />
                        </LabelWrapper>
                    </Row>
                    <Row>
                        <Col33>
                            <WrapperValueRight>
                                <LabelWrapper
                                    label="Limite de resultados"
                                    validate={{
                                        touched, errors,
                                        fieldName: "limit",
                                        isSubmitted: this.props.submitted
                                    }}
                                    tooltip="Limite de resultados apresentados"
                                >
                                    <StyledFormikField onBlur={(ev) => {
                                        setFieldValue("limit", ev.target.value);
                                        submit();
                                    }} type="text" name="limit" placeholder="Limit" />
                                </LabelWrapper>
                            </WrapperValueRight>
                        </Col33>
                        <Col33>
                            <WrapperValueLeft>
                                <LabelWrapper
                                    label="Randomizar resultados"
                                    validate={{
                                        touched, errors,
                                        fieldName: "random",
                                        isSubmitted: this.props.submitted
                                    }}
                                    tooltip="Randomizar resultados"
                                >
                                    <ButtonSelect
                                        onChange={(ev) => {
                                            values.random = ev;
                                            setFieldValue('random', ev);
                                            submit();
                                        }}
                                        value={values.random}
                                        options={[{ label: true }, { label: false }]}
                                    />
                                </LabelWrapper>
                            </WrapperValueLeft>
                        </Col33>
                        <Col33>
                            <LabelWrapper
                                label="Retorna o CNPJ"
                                validate={{
                                    touched, errors,
                                    fieldName: "shouldReturnCnpj",
                                    isSubmitted: this.props.submitted
                                }}
                                tooltip="Retorna o CNPJ no resultado"
                            >
                                <ButtonSelect
                                    onChange={(ev) => {
                                        values.shouldReturnCnpj = ev;
                                        setFieldValue('shouldReturnCnpj', ev);
                                        submit();
                                    }}
                                    value={values.shouldReturnCnpj}
                                    options={[{ label: true }, { label: false }]}
                                />
                            </LabelWrapper>
                        </Col33>
                    </Row>
                    <Space />
                    <LabelWrapper
                        label={`Mensagem de sucesso`}
                        tooltip="Envia um texto aleatório para o usuário"
                    >
                        <FieldArray
                            name="successMessage"
                            render={() => {
                                if (values.successMessage && isArray(values.successMessage)) {
                                    values.successMessage = values.successMessage;
                                } else {
                                    values.successMessage = [''];
                                }
                                return values.successMessage.map((text: string, index: number) =>
                                    <Row key={index} className="my-1">
                                        <div className="col-12 p-0">
                                            <StyledFormikField
                                                type="text"
                                                onBlur={submit}
                                                name={`successMessage[${index}]`}
                                                placeholder={"Text"}
                                            />
                                            {values.successMessage.length != 1
                                                ? <DeleteItem onClick={() => {
                                                    values.successMessage.splice(index, 1);
                                                    submit();
                                                }} />
                                                : null}
                                        </div>
                                    </Row>)
                            }}></FieldArray>
                    </LabelWrapper>
                    <CenterDiv>
                        <AddBtn onClick={() => {
                            values.successMessage.push('');
                            submit();
                        }} />
                    </CenterDiv>
                    <Space />
                    <LabelWrapper
                        label="Regras"
                        validate={{
                            touched, errors,
                            fieldName: `rules`,
                            isSubmitted: this.props.submitted
                        }}
                        tooltip="Regras que devem ser aplicadas no retorno"
                    >
                        <StyledFormikField
                            name="rules[0].name"
                            component="select"
                            onChange={(ev) => {
                                const item = [{
                                    name: ev.target.value,
                                    value: !!ev.target.value,
                                }];
                                values.rules = item;
                                setFieldValue('rules', item);
                                submit();
                            }}
                            style={{ width: "100%" }}>
                            <option value=''>Selecione uma regra</option>
                            <option value='ignore_hospitals'>Ignorar hospitais</option>

                        </StyledFormikField>
                    </LabelWrapper>
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
                            defaultValue={values.isEmptyGoto}
                            style={{ width: "100%" }}
                            onChange={(ev) => {
                                setFieldTouched('isEmptyGoto');
                                if (!ev) return;
                                values.isEmptyGoto = ev.value;
                                setFieldValue('isEmptyGoto', ev.value);
                                submit();
                            }}
                        />
                    </FormItemInteraction>
                </Form>
            }}
        />
    }
}

const mapStateToProps = (state, ownProps: any) => ({
    botAttributes: state.botReducer.botAttributes,
    entitiesList: state.entityReducer.entitiesList,
    interactionList: state.botReducer.interactionList,
    botList: state.workspaceReducer.botList,
})

const mapDispatchToProps = {
    setCurrentEntities: EntityActions.setCurrentEntities,
}

export const BotResponseMedicalGuide = withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
)(BotResponseMedicalGuideClass));
