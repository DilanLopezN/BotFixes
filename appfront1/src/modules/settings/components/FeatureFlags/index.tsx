import { Button, Divider } from 'antd';
import { useFormik } from 'formik-latest';
import { FC, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { AdvancedModuleFeatures, Workspace } from '../../../../model/Workspace';
import Toggle from '../../../../shared/Toggle/Toggle';
import { Card, Wrapper } from '../../../../ui-kissbot-v2/common';
import { isSystemAdmin } from '../../../../utils/UserPermission';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import Header from '../../../newChannelConfig/components/Header';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import { ScrollView } from '../ScrollView';
import { FeatureFlagsProps } from './props';

const FeatureFlags: FC<FeatureFlagsProps & I18nProps> = (props) => {
    const { menuSelected, selectedWorkspace, getTranslation, addNotification, setWorkspace } = props;

    const [loading, setLoading] = useState(false);

    const defaultInitialValues = {
        disabledWorkspace: false,
        enableModuleWhatsappFlow: false,
        enableRemi: false,
        enableAutomaticDistribution: false,
        enableTelegram: false,
        enableRuleAssumeByPermission: false,
        enableContactV2: false,
        enableModuleBillings: false,
        showMessageUserLimit: false,
        createTemplateWhatsappOfficial: false,
        enableAutoAssign: false,
        enableBotAudioTranscription: false,
        campaign: false,
        enableConfirmation: false,
        enableChannelApi: false,
        enableReminder: false,
        enableNps: false,
        enableMedicalReport: false,
        enableIVR: false,
        enableScheduleNotification: false,
        enableRecoverLostSchedule: false,
        enableNpsScore: false,
        enableDocumentsRequest: false,
        enableActiveMkt: false,
        enableModuleIntegrations: false,
        enableUploadErpDocuments: false,
        enableAgentStatus: false,
    };

    const getModifiedFields = <T extends object>(original?: T, updated?: T): Partial<T> => {
        const modified: Partial<T> = {};

        if (!original || !updated) return modified;

        for (const key in updated) {
            if (
                Object.prototype.hasOwnProperty.call(updated, key) &&
                original[key as keyof T] !== updated[key as keyof T]
            ) {
                modified[key as keyof T] = updated[key as keyof T];
            }
        }
        return modified;
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            ...defaultInitialValues,
            ...selectedWorkspace?.featureFlag,
            ...selectedWorkspace?.advancedModuleFeatures,
        },
        onSubmit: () => {
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    const { enableAgentStatus, ...restValues } = formik.values;
                    const workspaceEdited: Workspace = { ...selectedWorkspace, featureFlag: restValues };
                    updateWorkspace(workspaceEdited, { enableAgentStatus });
                }
            });
        },
    });

    const changedFlags = getModifiedFields(
        { ...defaultInitialValues, ...selectedWorkspace.featureFlag },
        formik.values
    );

    const updateWorkspace = async (workspace: Workspace, advancedModuleFeatures: AdvancedModuleFeatures) => {
        setLoading(true);
        let error: any;

        await WorkspaceService.updateAdvancedModule(
            selectedWorkspace._id,
            advancedModuleFeatures,
            (err) => (error = err)
        );

        const updatedWorkspace = await WorkspaceService.updateFlagsAndConfigs(
            selectedWorkspace._id,
            { featureFlag: changedFlags },
            (err) => (error = err)
        );

        setLoading(false);
        if (!error) {
            setWorkspace(updatedWorkspace);
            return addNotification({
                title: getTranslation('Success'),
                message: getTranslation('Saved successfully'),
                type: 'success',
                duration: 3000,
            });
        }
        return addNotification({
            title: getTranslation('Error'),
            message: getTranslation('Error. Try again'),
            type: 'warning',
            duration: 3000,
        });
    };

    return (
        <>
            <Wrapper>
                <Header title={menuSelected.title}></Header>
            </Wrapper>
            <ScrollView id='content-FeatureFlags'>
                <Wrapper margin='0 auto' maxWidth='1100px' minWidth='800px' padding={'20px 30px'}>
                    {selectedWorkspace && (
                        <>
                            {loading && (
                                <img
                                    alt={getTranslation('loading')}
                                    src={'/assets/img/loading.gif'}
                                    style={{
                                        height: '70px',
                                        padding: '0 10px',
                                        width: '100px',
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                    }}
                                />
                            )}
                            <Wrapper flexBox justifyContent='flex-end' alignItems='center' margin='0 0 15px 0'>
                                <Button
                                    disabled={loading}
                                    onClick={formik.submitForm}
                                    className='antd-span-default-color'
                                    type='primary'
                                >
                                    {getTranslation('Save')}
                                </Button>
                            </Wrapper>
                            <Card
                                styleHeader={{
                                    height: '45px',
                                    bgColor: '#f2f2f2',
                                    padding: '10px',
                                    color: '#555',
                                    fontSize: 'large',
                                    fontWeight: 'normal',
                                    textTransform: 'normal',
                                }}
                                header={getTranslation('Manage features')}
                                disabled={loading}
                            >
                                <form>
                                    <Divider orientation='left'>
                                        <b>{getTranslation('Geral')}</b>
                                    </Divider>
                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'Disable workspace - If this button is enabled, the workspace cannot be used by any user linked to it.'
                                        )}
                                        checked={formik.values.disabledWorkspace}
                                        onChange={() => {
                                            formik.setFieldValue('disabledWorkspace', !formik.values.disabledWorkspace);
                                        }}
                                    />
                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation('Ative para exibição e gerenciamento de Flows')}
                                        checked={formik.values.enableModuleWhatsappFlow}
                                        onChange={() => {
                                            formik.setFieldValue(
                                                'enableModuleWhatsappFlow',
                                                !formik.values.enableModuleWhatsappFlow
                                            );
                                        }}
                                    />
                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation('Ative para exibição e gerenciamento do Remi')}
                                        checked={formik.values.enableRemi}
                                        onChange={() => {
                                            formik.setFieldValue('enableRemi', !formik.values.enableRemi);
                                        }}
                                    />
                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'Ative para exibição e gerenciamento da distribuição automática'
                                        )}
                                        checked={formik.values.enableAutomaticDistribution}
                                        onChange={() => {
                                            formik.setFieldValue(
                                                'enableAutomaticDistribution',
                                                !formik.values.enableAutomaticDistribution
                                            );
                                        }}
                                    />
                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'Canal Telegram - Caso este botão esteja ativado, os filtros para canal no atendimento e no dashboard estarão visíveis para o cliente.'
                                        )}
                                        checked={formik.values.enableTelegram}
                                        onChange={() => {
                                            formik.setFieldValue('enableTelegram', !formik.values.enableTelegram);
                                        }}
                                    />

                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'Regra para assumir atendimento com permissão de ver historico - Caso este botão esteja ativado, a validação para assumir atendimento irá verificar se o agente possui permissão.'
                                        )}
                                        checked={formik.values.enableRuleAssumeByPermission}
                                        onChange={() => {
                                            formik.setFieldValue(
                                                'enableRuleAssumeByPermission',
                                                !formik.values.enableRuleAssumeByPermission
                                            );
                                        }}
                                    />

                                    {isSystemAdmin(props.loggedUser) && (
                                        <Toggle
                                            tabIndex='52'
                                            label={getTranslation('Habilita leitura de contatos do Postgres')}
                                            checked={formik.values.enableContactV2}
                                            onChange={() => {
                                                formik.setFieldValue('enableContactV2', !formik.values.enableContactV2);
                                            }}
                                        />
                                    )}

                                    <Divider orientation='left'>
                                        <b>{getTranslation('Settings')}</b>
                                    </Divider>
                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'Enable billing module - If this button is enabled, the billing module will be visible to the customer.'
                                        )}
                                        checked={formik.values.enableModuleBillings}
                                        onChange={() => {
                                            formik.setFieldValue(
                                                'enableModuleBillings',
                                                !formik.values.enableModuleBillings
                                            );
                                        }}
                                    />
                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'User limit message - If this button is activated, when creating a new user it will show a message if the user limit of your contract has been exceeded.'
                                        )}
                                        checked={formik.values.showMessageUserLimit}
                                        onChange={() => {
                                            formik.setFieldValue(
                                                'showMessageUserLimit',
                                                !formik.values.showMessageUserLimit
                                            );
                                        }}
                                    />
                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'Official template - If this button is enabled, it will allow the client to create official WhatsApp templates via the platform.'
                                        )}
                                        checked={formik.values.createTemplateWhatsappOfficial}
                                        onChange={() => {
                                            formik.setFieldValue(
                                                'createTemplateWhatsappOfficial',
                                                !formik.values.createTemplateWhatsappOfficial
                                            );
                                        }}
                                    />
                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'Auto assign - If this button is activated, the auto assign module will be visible to the customer.'
                                        )}
                                        checked={formik.values.enableAutoAssign}
                                        onChange={() => {
                                            formik.setFieldValue('enableAutoAssign', !formik.values.enableAutoAssign);
                                        }}
                                    />
                                    {isSystemAdmin(props.loggedUser) && (
                                        <Toggle
                                            tabIndex='52'
                                            label={getTranslation(
                                                'Audio transcription in the bot - If this option is enabled, audio transcription will be available for audio messages received in the bot flow.'
                                            )}
                                            checked={formik.values.enableBotAudioTranscription}
                                            onChange={() => {
                                                formik.setFieldValue(
                                                    'enableBotAudioTranscription',
                                                    !formik.values.enableBotAudioTranscription
                                                );
                                            }}
                                        />
                                    )}
                                    <Divider orientation='left'>
                                        <b>{getTranslation('Integration')}</b>
                                    </Divider>

                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'Enable Integrations Module - If this button is enabled, the integrations module will be visible to the customer.'
                                        )}
                                        checked={formik.values.enableModuleIntegrations}
                                        onChange={() => {
                                            formik.setFieldValue(
                                                'enableModuleIntegrations',
                                                !formik.values.enableModuleIntegrations
                                            );
                                        }}
                                    />

                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation(
                                            'Enable document sending to ERP – If this button is enabled, the customer will be able to send documents from the platform to their ERP system.'
                                        )}
                                        checked={formik.values.enableUploadErpDocuments}
                                        onChange={() => {
                                            formik.setFieldValue(
                                                'enableUploadErpDocuments',
                                                !formik.values.enableUploadErpDocuments
                                            );
                                        }}
                                    />

                                    <Divider orientation='left'>
                                        <b>{getTranslation('Advanced module')}</b>
                                    </Divider>

                                    <Toggle
                                        tabIndex='52'
                                        label={getTranslation('Activate agent status')}
                                        checked={formik.values.enableAgentStatus}
                                        onChange={() => {
                                            formik.setFieldValue('enableAgentStatus', !formik.values.enableAgentStatus);
                                        }}
                                    />
                                </form>
                            </Card>
                        </>
                    )}
                </Wrapper>
            </ScrollView>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    loggedUser: state.loginReducer.loggedUser,
});

export default I18n(
    withRouter(
        connect(mapStateToProps, {
            setWorkspace: WorkspaceActions.setSelectedWorkspace,
        })(FeatureFlags)
    )
);
