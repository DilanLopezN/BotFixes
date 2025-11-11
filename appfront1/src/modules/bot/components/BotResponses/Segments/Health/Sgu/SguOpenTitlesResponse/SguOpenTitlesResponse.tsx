import { Component } from 'react';
import { connect } from 'react-redux';
import { BotResponseProps } from '../../../../interfaces';
import { Formik, Form } from 'formik';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import I18n from '../../../../../../../i18n/components/i18n';
import * as Yup from 'yup';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../../../../../shared/InputSample/InputSimple';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { BotService } from '../../../../../../services/BotService';
import { Interaction } from '../../../../../../../../model/Interaction';
import styled from 'styled-components';
import { RouteComponentProps, withRouter } from 'react-router';

const TextFieldWrapper = styled("div")`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
    position: relative;
`

interface ISguOpenTitlesElement {
    attrNameCarteirinha: string;
    sguUrl: string;
    sguToken: string;
    isErrorGoto: string;
    isEmptyGoto: string;
}

interface RouteParams {
    workspaceId: string;
    botId: string;
}

interface BotResponseSguOpenTitlesProps extends BotResponseProps, I18nProps, RouteComponentProps<RouteParams> {}

interface BotResponseSguOpenTitlesState {
    interactionList: Array<Interaction>;
}

export class BotResponseSguOpenTitlesClass extends Component<BotResponseSguOpenTitlesProps, BotResponseSguOpenTitlesState> {
    constructor(props: Readonly<BotResponseSguOpenTitlesProps>) {
        super(props);
        this.state = {
            interactionList: [],
        };
    }

    async componentDidMount() {
        await this.fetchInteractions();
    }

    private fetchInteractions = async () => {
        const { match } = this.props;
        const workspaceId = match.params.workspaceId;
        const botId = match.params.botId;

        try {
            const { data: interactions } = await BotService.getInteractions(workspaceId, botId);
            this.setState({ interactionList: interactions || [] });
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        const { getTranslation } = this.props;
        return Yup.object().shape({
            attrNameCarteirinha: Yup.string().required(getTranslation('This field is required')),
            sguUrl: Yup.string().required(getTranslation('This field is required')),
            sguToken: Yup.string().required(getTranslation('This field is required')),
            isErrorGoto: Yup.string().required(getTranslation('This field is required')),
            isEmptyGoto: Yup.string().required(getTranslation('This field is required')),
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange({ ...response });
    };

    render() {
        const elements: Array<ISguOpenTitlesElement> = this.props.response
            .elements as Array<ISguOpenTitlesElement>;
        const { interactionList } = this.state;

        return (
            <Formik
                initialValues={{ ...(elements[0] as ISguOpenTitlesElement) }}
                validationSchema={this.getValidationSchema()}
                onSubmit={() => {}}
                render={({ values, submitForm, validateForm, setFieldValue, touched, errors }) => {
                    const submit = () => {
                        validateForm()
                            .then((validatedValues: any) => {
                                if (validatedValues.isCanceled) {
                                    submit();
                                    return;
                                }
                                if (Object.keys(validatedValues).length !== 0) {
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
                            <TextFieldWrapper>
                                <LabelWrapper
                                    label='Attr Name Carteirinha'
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'attrNameCarteirinha',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('Attr Name Carteirinha')}
                                >
                                    <InputSimple
                                        type='text'
                                        value={values.attrNameCarteirinha}
                                        onBlur={submit}
                                        name={'attrNameCarteirinha'}
                                        placeholder={'Attr Name Carteirinha'}
                                        onChange={(event) => {
                                            values.attrNameCarteirinha = event.target.value;
                                            setFieldValue(`attrNameCarteirinha`, event.target.value);
                                            submit();
                                        }}
                                    />
                                </LabelWrapper>
                                <LabelWrapper
                                    label='SGU URL'
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'sguUrl',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('SGU URL')}
                                >
                                    <InputSimple
                                        type='text'
                                        value={values.sguUrl}
                                        onBlur={submit}
                                        name={'sguUrl'}
                                        placeholder={'SGU URL'}
                                        onChange={(event) => {
                                            values.sguUrl = event.target.value;
                                            setFieldValue(`sguUrl`, event.target.value);
                                            submit();
                                        }}
                                    />
                                </LabelWrapper>
                                <LabelWrapper
                                    label='SGU Token'
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'sguToken',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('SGU Token')}
                                >
                                    <InputSimple
                                        type='text'
                                        value={values.sguToken}
                                        onBlur={submit}
                                        name={'sguToken'}
                                        placeholder={'SGU Token'}
                                        onChange={(event) => {
                                            values.sguToken = event.target.value;
                                            setFieldValue(`sguToken`, event.target.value);
                                            submit();
                                        }}
                                    />
                                </LabelWrapper>
                                <LabelWrapper
                                    label='Is Error Goto'
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'isErrorGoto',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('Is Error Goto')}
                                >
                                    <InteractionSelect
                                        name='isErrorGoto'
                                        options={interactionList || []}
                                        interactionTypeToShow={['interaction', 'welcome', 'fallback']}
                                        defaultValue={values.isErrorGoto}
                                        placeholder={this.props.getTranslation('Select a interaction')}
                                        onChange={(event) => {
                                            if (!event) return;
                                            values.isErrorGoto = (event && event.value) || '';
                                            setFieldValue(`isErrorGoto`, (event && event.value) || '');
                                            submit();
                                        }}
                                    />
                                </LabelWrapper>
                                <LabelWrapper
                                    label='Is Empty Goto'
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'isEmptyGoto',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('Is Empty Goto')}
                                >
                                    <InteractionSelect
                                        name='isEmptyGoto'
                                        options={interactionList || []}
                                        interactionTypeToShow={['interaction', 'welcome', 'fallback']}
                                        defaultValue={values.isEmptyGoto}
                                        placeholder={this.props.getTranslation('Select a interaction')}
                                        onChange={(event) => {
                                            if (!event) return;
                                            values.isEmptyGoto = (event && event.value) || '';
                                            setFieldValue(`isEmptyGoto`, (event && event.value) || '');
                                            submit();
                                        }}
                                    />
                                </LabelWrapper>
                            </TextFieldWrapper>
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = () => ({});

export const BotResponseSguOpenTitles = I18n(withRouter(connect(mapStateToProps, {})(BotResponseSguOpenTitlesClass)));
