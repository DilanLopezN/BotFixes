import { Formik } from 'formik';
import { IResponseElementGoto } from 'kissbot-core';
import { FC, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as Yup from 'yup';
import { Interaction } from '../../../../../model/Interaction';
import { ResponseElement } from '../../../../../model/ResponseElement';
import { FormItemInteraction } from '../../../../../shared-v2/FormItemInteraction';
import { InteractionSelect } from '../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import I18n from '../../../../i18n/components/i18n';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';
import { BotService } from '../../../services/BotService';
import { BotResponseGotoProps } from './BotResponseGotoProps';
import { FieldContainer } from './styles';

const BotResponseGoto: FC<BotResponseGotoProps & I18nProps> = ({
    getArray,
    getTranslation,
    onChange,
    response,
    match,
    submitted,
}) => {
    const { elements } = response;
    const {
        params: { workspaceId: matchWorkspaceId, botId: matchBotId },
    } = match;
    const [interactionList, setInteractionList] = useState<undefined | Array<Interaction>>([]);

    const getValidationSchema = () => {
        return Yup.object().shape({
            interaction: Yup.object().shape({
                value: Yup.string().required(getTranslation('This field is required')),
            }),
        });
    };

    const onChangeUpdate = useCallback(
        (goto: IResponseElementGoto, isValid: boolean) => {
            const updatedResponse = { ...response };
            updatedResponse.elements[0] = {
                value: goto.value,
                workspaceId: goto.workspaceId,
                botId: goto.botId,
            } as ResponseElement;
            updatedResponse.isResponseValid = isValid;
            onChange(updatedResponse);
        },
        [onChange, response]
    );

    const fetchInteractions = useCallback(
        async (botId: string, currWorkspaceId?: string) => {
            const workspaceId = currWorkspaceId || elements[0]?.workspaceId || matchWorkspaceId;

            setInteractionList([]);

            try {
                const { data: interactions } = await BotService.getInteractions(workspaceId, botId);
                setInteractionList(interactions || []);
            } catch (error) {
                dispatchSentryError(error);
            }
        },
        [matchWorkspaceId, elements]
    );

    const fetchBotsWorkspace = useCallback(
        async (currWorkspaceId?: string) => {
            const workspaceId = currWorkspaceId || elements[0]?.workspaceId || matchWorkspaceId;
            const botId = elements[0]?.botId || matchBotId;

            await fetchInteractions(botId, workspaceId);
        },
        [matchBotId, matchWorkspaceId, elements, fetchInteractions]
    );

    useEffect(() => {
        fetchBotsWorkspace();
    }, []);

    useEffect(() => {
        if (
            (!!response.elements[0].botId && response.elements[0].botId !== matchBotId) ||
            (response.elements[0].workspaceId && response.elements[0].workspaceId !== matchWorkspaceId)
        ) {
            onChangeUpdate(
                { ...response.elements[0], botId: matchBotId, workspaceId: matchWorkspaceId, value: '' },
                false
            );
            setTimeout(() => {
                fetchInteractions(matchBotId, matchWorkspaceId);
            }, 500);
        }
    }, [matchBotId, matchWorkspaceId, onChangeUpdate, response, response.elements]);

    return (
        <Formik
            initialValues={
                {
                    ...response.elements[0],

                    workspaceId: response.elements[0].workspaceId || match.params.workspaceId,
                    botId: response.elements[0].botId || match.params.botId,
                } as IResponseElementGoto
            }
            enableReinitialize
            onSubmit={() => {}}
            isInitialValid={true}
            validationSchema={getValidationSchema()}
            render={({ values, submitForm, validateForm, errors, touched, handleChange, setFieldValue }) => {
                const submit = () => {
                    validateForm()
                        .then((validatedValues: any) => {
                            if (validatedValues.isCanceled) {
                                submit();
                                return;
                            }
                            if (Object.keys(validatedValues).length !== 0) {
                                onChangeUpdate(values, false);
                            } else {
                                onChangeUpdate(values, true);
                            }
                            submitForm();
                        })
                        .catch((e) => dispatchSentryError(e));
                };
                const title = interactionList && interactionList.find((e) => e._id === values.value);

                return (
                    <div>
                        <FieldContainer title={title?.name}>
                            <FormItemInteraction
                                interaction={values.value}
                                label={getTranslation('Choose an interaction')}
                                validate={{
                                    errors,
                                    touched,
                                    fieldName: 'interaction.value',
                                    isSubmitted: submitted,
                                }}
                            >
                                <InteractionSelect
                                    name='interaction.value'
                                    options={(interactionList && interactionList) || []}
                                    interactionTypeToShow={['interaction', 'welcome', 'fallback']}
                                    defaultValue={values.value}
                                    placeholder={getTranslation('Select a interaction')}
                                    onChange={(event) => {
                                        if (!event) return;
                                        values.value = (event && event.value) || '';
                                        setFieldValue(`interaction.value`, (event && event.value) || '');
                                        submit();
                                    }}
                                />
                            </FormItemInteraction>
                        </FieldContainer>
                    </div>
                );
            }}
        />
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
});

export default I18n(withRouter(connect(mapStateToProps, {})(BotResponseGoto)));
