import { Component } from 'react';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import styled from 'styled-components';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerDoctorSchedulesProps } from './props';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import i18n from '../../../../../../../i18n/components/i18n';
import { IResponseElementBDCheckDoctor, IResponseElementBDListDoctorSchedules } from 'kissbot-core';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';
import { WrapperFieldAttr } from '../WrapperField';
import { Col, Row } from 'antd';
import Toggle from '../../../../../../../../shared/Toggle/Toggle';

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

export default class BotDesignerDoctorSchedulesClass extends Component<BotDesignerDoctorSchedulesProps> {
    constructor(props: Readonly<BotDesignerDoctorSchedulesProps>) {
        super(props);
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            attrNameDoctorData: Yup.string().required(this.props.getTranslation('Required field')),
            integrationId: Yup.string().required(this.props.getTranslation('Required field')),
            url: Yup.string().required(this.props.getTranslation('Required field')),
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render() {
        return (
            <Formik
                initialValues={{
                    ...(this.props.response.elements[0] as IResponseElementBDListDoctorSchedules),
                }}
                onSubmit={() => {}}
                validationSchema={this.getValidationSchema()}
                render={({ values, submitForm, validateForm, setFieldValue, touched, errors, setFieldTouched }) => {
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
                                <LabelWrapper
                                    label={this.props.getTranslation('Service endpoint')}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'url',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('Service endpoint')}
                                >
                                    <StyledFormikField
                                        type='text'
                                        onBlur={submit}
                                        name={`url`}
                                        placeholder={this.props.getTranslation('Service endpoint')}
                                    />
                                </LabelWrapper>
                            </Row>
                            <Row>
                                <LabelWrapper
                                    label={this.props.getTranslation('Integration')}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'integrationId',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('Integration')}
                                >
                                    <StyledFormikField
                                        type='text'
                                        onBlur={submit}
                                        name={`integrationId`}
                                        placeholder={this.props.getTranslation('Integration')}
                                    />
                                </LabelWrapper>
                            </Row>

                            <CenterDiv>{this.props.getTranslation('Fill in with equivalent attributes')}:</CenterDiv>

                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <WrapperFieldAttr
                                        errors={errors}
                                        values={values}
                                        setFieldTouched={setFieldTouched}
                                        setFieldValue={setFieldValue}
                                        submit={submit}
                                        submitted={this.props.submitted}
                                        touched={touched}
                                        fieldName='attrNameDoctorData'
                                        fieldDescription={this.props.getTranslation('Doctor data')}
                                        fieldTitle={this.props.getTranslation('Doctor data')}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]}>
                                {/* <Col span={12}> */}
                                    <LabelWrapper
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `buildCompleteScheduleInfo`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                            <Toggle
                                                tabIndex='52'
                                                checked={!!values.buildCompleteScheduleInfo}
                                                onChange={() => {
                                                    setFieldValue(
                                                        'buildCompleteScheduleInfo',
                                                        !values.buildCompleteScheduleInfo
                                                    );
                                                    values.buildCompleteScheduleInfo = !values.buildCompleteScheduleInfo;
                                                    submit();
                                                }}
                                            />
                                            <div style={{ margin: '0 0 0 10px' }}>
                                                Adicionar informações completas na desrição do agendamento, incluindo classificação, unidade e convenio.
                                            </div>
                                        </div>
                                    </LabelWrapper>
                                {/* </Col> */}
                            </Row>
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

export const BotDesignerDoctorSchedules = i18n(
    withRouter(connect(mapStateToProps, {})(BotDesignerDoctorSchedulesClass))
);
