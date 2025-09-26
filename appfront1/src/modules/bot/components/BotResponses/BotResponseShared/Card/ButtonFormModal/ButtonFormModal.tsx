import { Formik } from 'formik';
import { IButton } from 'kissbot-core';
import omit from 'lodash/omit';
import { Component } from 'react';
import { connect } from 'react-redux';
import { v4 } from 'uuid';
import * as Yup from 'yup';
import { DiscardBtn } from '../../../../../../../shared/StyledForms/DiscardBtn/DiscardBtn';
import { DoneBtn } from '../../../../../../../shared/StyledForms/DoneBtn/DoneBtn';
import { Wrapper } from '../../../../../../../ui-kissbot-v2/common';
import { dispatchSentryError } from '../../../../../../../utils/Sentry';
import I18n from '../../../../../../i18n/components/i18n';
import { ButtonFormModalProps, ButtonFormModalState, ButtonFormView } from './ButtonFormModalProps';
import Actions from './components/actions';
import General from './components/general';
import Header from './components/header';

class ButtonFormModalClass extends Component<ButtonFormModalProps, ButtonFormModalState> {
    constructor(props: ButtonFormModalProps) {
        super(props);
        this.state = {
            isOpenedDismissModal: false,
            viewSelected: ButtonFormView.general,
        };
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        const { getTranslation } = this.props;

        return Yup.object().shape({
            type: Yup.string().required(getTranslation('This field is required')),
            title: Yup.string().required(getTranslation('This field is required')),
            value: Yup.string().required(getTranslation('This field is required')),
        });
    };

    /**
     * Função para pegar valor inicial do campo value do botão.
     * Tem que ter essa função senão o formulário vem preenchido de forma incorreta,
     * pois o campo value varia o tipo de campo de acordo com o o cmapo type. Ex: type=goto o campo value é do tipo select, type=url value é do tipo text
     */
    getValueForInit = () => {
        const button = this.props.button;
        if (!button.value) {
            return '';
        }
        return button.value;
    };

    getViewToRender = (props) => {
        switch (this.state.viewSelected) {
            case ButtonFormView.general:
                return (
                    <General
                        {...props}
                        buildAsQuickReply={this.props.buildAsQuickReply}
                        buildAsList={this.props.buildAsList}
                    />
                );
            case ButtonFormView.actions:
                return <Actions {...props} />;
        }
    };

    replaceActions = () => {
        const { button } = this.props;

        if (button.actions && button.actions.length === 0) return [];

        return (
            button.actions &&
            button.actions.map((action) => ({
                ...action,
                maximized: false,
                id: v4(),
            }))
        );
    };

    render() {
        const value = this.getValueForInit();
        const { getTranslation, botAttributes, entitiesList, interactionList } = this.props;

        return (
            <Wrapper minWidth='355px'>
                <Formik
                    initialValues={{ ...this.props.button, value, actions: this.replaceActions() } as IButton}
                    onSubmit={() => {}}
                    validationSchema={this.getValidationSchema()}
                    render={({ submitForm, values, setFieldValue, validateForm, touched, errors }) => {
                        const submit = () => {
                            validateForm()
                                .then((validatedValues) => {
                                    if (Object.keys(validatedValues).length != 0) {
                                        this.setState({ isOpenedDismissModal: true });
                                    } else {
                                        const valuesUpdated: any =
                                            values.actions &&
                                            values.actions.map((action) => omit(action, ['id', 'maximized']));
                                        values.actions = valuesUpdated;

                                        this.props.onChange(values);
                                        this.props.onClose();
                                    }
                                    submitForm();
                                })
                                .catch((e) => dispatchSentryError(e));
                        };
                        return (
                            <div>
                                <Header
                                    viewSelected={this.state.viewSelected}
                                    onViewChanged={(view: ButtonFormView) => {
                                        this.setState({
                                            viewSelected: view,
                                        });
                                    }}
                                    values={values}
                                />

                                {this.getViewToRender({
                                    interactionList,
                                    values,
                                    touched,
                                    errors,
                                    isSubmitted: this.props.isSubmitted,
                                    setFieldValue,
                                    botAttributes,
                                    entitiesList,
                                })}

                                <Wrapper flexBox margin='15px 0' justifyContent='flex-end'>
                                    <DiscardBtn onClick={this.props.onClose}>{getTranslation('Cancel')}</DiscardBtn>
                                    <DoneBtn onClick={submit}>{getTranslation('Save')}</DoneBtn>
                                </Wrapper>
                            </div>
                        );
                    }}
                />
            </Wrapper>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
    botAttributes: state.botReducer.botAttributes,
    entitiesList: state.entityReducer.entitiesList,
});

export const ButtonFormModal = I18n(connect(mapStateToProps, {})(ButtonFormModalClass));
