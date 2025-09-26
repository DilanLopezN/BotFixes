import { Form, Formik } from 'formik';
import { Component } from 'react';
import { connect } from 'react-redux';
import * as Yup from 'yup';
import { FormItemInteraction } from '../../../../../shared-v2/FormItemInteraction';
import ChannelIdList from '../../../../../shared/ChannelIdList';
import ChannelList from '../../../../../shared/ChannelList';
import { InteractionSelect } from '../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import I18n from '../../../../i18n/components/i18n';
import { BotResponseTransboardProps } from './BotResponseTransboardProps';

class BotResponseTransboardClass extends Component<BotResponseTransboardProps> {
    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            channelId: Yup.string().required('This field is required'),
            channelConfigId: Yup.string().required('This field is required'),
            cannotTransboardGoto: Yup.string(),
        });
    };

    onChange = (values, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render() {
        const { elements } = this.props.response;

        const { currentBot, getTranslation, selectedWorkspace } = this.props;

        const getInitialValue = () => {
            const el = elements[0];

            if (el.hasOwnProperty('cannotTransboardGoto')) {
                return elements[0];
            } else {
                return {
                    channelId: '',
                    cannotTransboardGoto: '',
                    channelConfigId: '',
                };
            }
        };

        return (
            <Formik
                initialValues={{ ...getInitialValue() }}
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
                    const { interactionList } = this.props;

                    const title = interactionList && interactionList.find((e) => e._id === values.cannotTransboardGoto);
                    return (
                        <Form>
                            <LabelWrapper
                                label={getTranslation('Channel Id')}
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: `channelId`,
                                    isSubmitted: this.props.submitted,
                                }}
                                tooltip={getTranslation('Transfer destination channel Id')}
                            >
                                <ChannelIdList
                                    currentValue={values.channelId}
                                    onChange={(event) => {
                                        setFieldTouched('channelId');
                                        values.channelId = event.value;
                                        setFieldValue('channelId', event.value);
                                        submit();
                                    }}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                label={getTranslation('Channel')}
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: `channelConfigId`,
                                    isSubmitted: this.props.submitted,
                                }}
                                tooltip={getTranslation('Transfer destination channel')}
                            >
                                <ChannelList
                                    currentValue={values.channelConfigId}
                                    botId={currentBot._id}
                                    onChange={(event) => {
                                        setFieldTouched('channelConfigId');
                                        values.channelConfigId = event.value;
                                        setFieldValue('channelConfigId', event.value);
                                        submit();
                                    }}
                                />
                            </LabelWrapper>

                            <div title={title?.name}>
                                <FormItemInteraction
                                    interaction={values.cannotTransboardGoto}
                                    label={getTranslation('Interaction')}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `isEmptyGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={getTranslation(
                                        'If the channel is outside office hours, the bot will continue from an interaction.'
                                    )}
                                >
                                    <InteractionSelect
                                        name='cannotTransboardGoto'
                                        interactionTypeToShow={['interaction', 'welcome']}
                                        options={this.props.interactionList}
                                        defaultValue={values.cannotTransboardGoto}
                                        placeholder={getTranslation('Select a interaction')}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('cannotTransboardGoto');
                                            values.cannotTransboardGoto = ev.value || '';
                                            setFieldValue('cannotTransboardGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </div>
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = (state) => ({
    interactionList: state.botReducer.interactionList,
    currentBot: state.botReducer.currentBot,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export const BotResponseTransboard = I18n(connect(mapStateToProps, null)(BotResponseTransboardClass));
