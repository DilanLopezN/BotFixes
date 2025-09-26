import { Form, Formik } from 'formik';
import { Component } from 'react';
import { connect } from 'react-redux';
import * as Yup from 'yup';
import { Team } from '../../../../../model/Team';
import { FormItemInteraction } from '../../../../../shared-v2/FormItemInteraction';
import { InteractionSelect } from '../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import TeamSelect from '../../../../../shared/TeamSelect';
import Toggle from '../../../../../shared/Toggle/Toggle';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import I18n from '../../../../i18n/components/i18n';
import { BotResponseConversationAssignedProps } from './props';

class BotResponseConversationAssignedClass extends Component<
    BotResponseConversationAssignedProps,
    { usersIds: string[] | undefined }
> {
    state = {
        usersIds: undefined,
    };

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            teamId: Yup.string().required('This field is required'),
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
        const { getTranslation, selectedWorkspace } = this.props;
        const getInitialValue = (): any => {
            const el = elements[0];
            if (el) {
                return el;
            } else {
                return {
                    cannotAssignGoto: '',
                    teamId: '',
                    onlyValidateAttendance: false,
                };
            }
        };

        const setTeamIds = (selectedTeam: Team) => {
            if (!!selectedTeam && Array.isArray(selectedTeam.roleUsers)) {
                const usersIds = (selectedTeam as any as Team).roleUsers.reduce((prev, curr) => {
                    prev.push(curr.userId);
                    return prev;
                }, [] as string[]);
                this.setState({ usersIds });
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
                    return (
                        <Form>
                            <LabelWrapper
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: `onlyValidateAttendance`,
                                    isSubmitted: this.props.submitted,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                    <Toggle
                                        tabIndex='52'
                                        checked={values.onlyValidateAttendance}
                                        onChange={() => {
                                            setFieldValue('onlyValidateAttendance', !values.onlyValidateAttendance);
                                            values.onlyValidateAttendance = !values.onlyValidateAttendance;
                                            submit();
                                        }}
                                    />
                                    <div style={{ margin: '0 0 0 10px' }}>
                                        {getTranslation('Only validate attendance')}
                                    </div>
                                </div>
                            </LabelWrapper>

                            <LabelWrapper
                                label={getTranslation('Team')}
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: `teamId`,
                                    isSubmitted: this.props.submitted,
                                    ignoreErrorMessage: [getTranslation('Cannot found any team')],
                                }}
                                tooltip={getTranslation('Assign conversation to give team')}
                            >
                                <TeamSelect
                                    currentValue={values.teamId}
                                    workspaceId={selectedWorkspace._id}
                                    onChange={(event) => {
                                        setFieldTouched('teamId');
                                        values.teamId = event._id;
                                        setFieldValue('teamId', event._id);
                                        submit();
                                        setTeamIds(event);
                                    }}
                                />
                            </LabelWrapper>

                            <div style={{ margin: '10px 0 0 0' }}>
                                <LabelWrapper
                                    label={getTranslation('Priority')}
                                    validate={{
                                        errors,
                                        touched,
                                        fieldName: 'priority',
                                        isSubmitted: this.props.submitted,
                                    }}
                                >
                                    <StyledFormikField
                                        onBlur={submit}
                                        name='priority'
                                        placeholder={getTranslation('Priority')}
                                    />
                                </LabelWrapper>
                            </div>

                            <FormItemInteraction
                                interaction={values.cannotAssignGoto}
                                label={getTranslation('Cannot assign conversation')}
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: `cannotAssignGoto`,
                                    isSubmitted: this.props.submitted,
                                }}
                                tooltip={getTranslation(
                                    'If the team is outside office hours, the bot will continue from an interaction.'
                                )}
                            >
                                <InteractionSelect
                                    name='cannotAssignGoto'
                                    interactionTypeToShow={['interaction', 'welcome']}
                                    options={this.props.interactionList}
                                    defaultValue={values.cannotAssignGoto}
                                    placeholder={getTranslation('Select a interaction')}
                                    style={{ width: '100%' }}
                                    onChange={(ev) => {
                                        setFieldTouched('cannotAssignGoto');
                                        values.cannotAssignGoto = ev.value || '';
                                        setFieldValue('cannotAssignGoto', ev.value);
                                        submit();
                                    }}
                                />
                            </FormItemInteraction>
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = (state) => ({
    interactionList: state.botReducer.interactionList,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    currentBot: state.botReducer.currentBot,
});

export const BotResponseConversationAssigned = I18n(
    connect(mapStateToProps, null)(BotResponseConversationAssignedClass)
);
