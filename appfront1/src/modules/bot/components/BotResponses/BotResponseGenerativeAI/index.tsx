import { Form, Formik } from 'formik';
import { IResponseElementProtocol } from 'kissbot-core';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import styled from 'styled-components';
import i18n from '../../../../i18n/components/i18n';
import { TextAreaSimple } from '../../../../../shared/TextAreaSimple/TextAreaSimple';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';

const Row = styled('div')`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const FieldWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 15px;
    width: 100%;
`;

export default class BotResponseGenerativeAIClass extends Component<any> {
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
                    startMessage: '',
                    ...(this.props.response.elements[0] as IResponseElementProtocol),
                }}
                onSubmit={() => {}}
                render={({ values, setFieldValue }) => {
                    const handleStartMessageChange = (event) => {
                        const newValue = event.target.value;
                        setFieldValue('startMessage', newValue);
                        this.onChange({ ...values, startMessage: newValue }, true);
                    };

                    return (
                        <Form>
                            <FieldWrapper>
                                <LabelWrapper>
                                    <label>Mensagem inicial:</label>
                                    <TextAreaSimple
                                        value={values.startMessage || ''}
                                        onChange={handleStartMessageChange}
                                        placeholder="Digite a mensagem inicial para o prompt..."
                                        rows={6}
                                        style={{
                                            width: '100%',
                                            height: '120px',
                                            minHeight: '120px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </LabelWrapper>
                            </FieldWrapper>
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const BotResponseGenerativeAI = i18n(withRouter(connect(mapStateToProps, {})(BotResponseGenerativeAIClass)));
