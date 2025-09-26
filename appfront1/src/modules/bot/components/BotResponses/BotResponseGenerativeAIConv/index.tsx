import { Formik } from 'formik';
import { IResponseElementProtocol } from 'kissbot-core';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import i18n from '../../../../i18n/components/i18n';

export default class BotResponseGenerativeAIConvClass extends Component<any> {
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
                    return null;
                }}
            />
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const BotResponseGenerativeAIConv = i18n(
    withRouter(connect(mapStateToProps, {})(BotResponseGenerativeAIConvClass))
);
