import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { withRouter } from 'react-router';
import { BotResponseSearchIdProps } from './BotResponseSearchIdProps';
import styled from 'styled-components';
import { LabelWrapper } from '../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { CustomCreatableSelect } from '../../../../../../../shared/StyledForms/CustomCreatableSelect/CustomCreatableSelect';
import { StyledFormikField } from '../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { v4 } from 'uuid';
import { BotAttrs } from '../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import { dispatchSentryError } from '../../../../../../../utils/Sentry';

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

class BotResponseSearchIdClass extends Component<BotResponseSearchIdProps> {
    constructor(props: Readonly<BotResponseSearchIdProps>) {
        super(props);
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            idAttr: Yup.string().required('Campo obrigatório'),
            saveOnAttr: Yup.string().required('Campo obrigatório')
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render() {
        return <Formik
            initialValues={{
                ...this.props.response.elements[0]
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
                    <Row>
                        <Col50>
                            <WrapperValueRight>
                                <LabelWrapper
                                    label="Atributo Id"
                                    validate={{
                                        touched, errors,
                                        fieldName: "idAttr",
                                        isSubmitted: this.props.submitted
                                    }}
                                    tooltip="Atributo do Id"
                                >
                                    <StyledFormikField name="idAttr"
                                        component="select"
                                        onChange={(ev) => {
                                            setFieldValue(`idAttr`, ev.target.value);
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
                        <Col50>
                            <WrapperValueLeft>
                                <LabelWrapper
                                    label="Salvar no atributo"
                                    validate={{
                                        touched, errors,
                                        fieldName: "saveOnAttr",
                                        isSubmitted: this.props.submitted
                                    }}
                                    tooltip="Salvar dado em um atributo"
                                >
                                    <BotAttrs
                                        value={{
                                            value: values.saveOnAttr ? values.saveOnAttr : '',
                                            label: values.saveOnAttr ? values.saveOnAttr : ''
                                        }}
                                        onCreateOption={event => {
                                            setFieldValue('saveOnAttr', event);
                                            values.saveOnAttr = event;
                                            setFieldValue('saveOnAttr', event);
                                            submit();
                                        }}
                                        onChange={event => {
                                            setFieldTouched('saveOnAttr');
                                            values.saveOnAttr = event.value;
                                            setFieldValue('saveOnAttr', event.value);
                                            submit();
                                        }}
                                        showOnly={['others']}
                                        creatable
                                    />
                                </LabelWrapper>
                            </WrapperValueLeft>
                        </Col50>
                    </Row>
                </Form>
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    botAttributes: state.botReducer.botAttributes,
});

export const BotResponseSearchId = withRouter(connect(
    mapStateToProps,
    {}
)(BotResponseSearchIdClass));