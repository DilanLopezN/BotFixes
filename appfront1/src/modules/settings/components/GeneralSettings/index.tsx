import { Button, Input, Modal, Select, Switch } from 'antd';
import { Option } from 'antd/lib/mentions';
import { FC, useEffect, useState } from 'react';
import { AiOutlineSound } from 'react-icons/ai';
import { connect, useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { GeneralConfigs, NotificationSongs, Workspace } from '../../../../model/Workspace';
import ActivityPreview from '../../../../shared-v2/ActivityPreview/ActivityPreview';
import { SettingsItem } from '../../../../shared/SettingsItem/SettingsItem';
import { Card, Wrapper } from '../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../utils/AddNotification';
import { isSystemAdmin, isSystemCsAdmin, isSystemDevAdmin } from '../../../../utils/UserPermission';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import Header from '../../../newChannelConfig/components/Header';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import { ScrollView } from '../ScrollView';
import { GeneralSettingsProps } from './props';

const GeneralSettings: FC<GeneralSettingsProps & I18nProps> = ({ getTranslation, selectedWorkspace, setWorkspace }) => {
    const [workspaceName, setWorkspaceName] = useState(selectedWorkspace.name);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [workspaceCustomerSettings, setWorkspaceCustomerSettings] = useState(selectedWorkspace.customerXSettings);

    const [songValue, setSongValue] = useState(
        selectedWorkspace?.generalConfigs?.notificationSong || NotificationSongs.OPTION_1
    );
    const [enableCampaignAllUsers, setEnableCampaignAllUsers] = useState(
        selectedWorkspace?.generalConfigs?.enableCampaignAllUsers ?? false
    );
    const [enableEditProfileAllUsers, setEnableEditProfileAllUsers] = useState(
        selectedWorkspace?.generalConfigs?.enableEditProfileAllUsers ?? false
    );
    const [enableAutomaticSendingListAllUsers, setEnableAutomaticSendingListAllUsers] = useState(
        selectedWorkspace?.generalConfigs?.enableAutomaticSendingListAllUsers ?? false
    );

    const [enableIndividualCancelInConfirmation, setEnableIndividualCancelInConfirmation] = useState(
        selectedWorkspace?.generalConfigs?.enableIndividualCancelInConfirmation ?? false
    );

    const [enableAutoCompleteTemplateVariables, setEnableAutoCompleteTemplateVariables] = useState(
        selectedWorkspace?.generalConfigs?.enableAutoCompleteTemplateVariables ?? false
    );

    const [enableAgentsTeamHistoryAccess, setEnableAgentsTeamHistoryAccess] = useState(
        selectedWorkspace?.generalConfigs?.enableAgentsTeamHistoryAccess ?? false
    );

    const [enableConcatAgentNameInMessage, setEnableConcatAgentNameInMessage] = useState(
        selectedWorkspace?.generalConfigs?.enableConcatAgentNameInMessage ?? false
    );
    const [enableIgnoreUserFollowupConversation, setEnableIgnoreUserFollowupConversation] = useState(
        selectedWorkspace?.generalConfigs?.enableIgnoreUserFollowupConversation ?? false
    );

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

    const getUpdatedGeneralConfigs = (overrides: Partial<GeneralConfigs> = {}): GeneralConfigs => ({
        notificationSong: songValue,
        enableCampaignAllUsers: enableCampaignAllUsers,
        enableEditProfileAllUsers: enableEditProfileAllUsers,
        enableAutomaticSendingListAllUsers: enableAutomaticSendingListAllUsers,
        enableIndividualCancelInConfirmation: enableIndividualCancelInConfirmation,
        enableAutoCompleteTemplateVariables: enableAutoCompleteTemplateVariables,
        enableAgentsTeamHistoryAccess: enableAgentsTeamHistoryAccess,
        enableConcatAgentNameInMessage: enableConcatAgentNameInMessage,
        ...overrides,
    });

    const updateWorkspace = async (workspace: Workspace) => {
        let error: any;
        const changedGeneralConfigs = getModifiedFields(selectedWorkspace?.generalConfigs, workspace.generalConfigs);

        const updatedWorkspace = await WorkspaceService.updateFlagsAndConfigs(
            selectedWorkspace._id,
            { generalConfigs: changedGeneralConfigs },
            (err) => (error = err)
        );

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

    const updateWorkspaceName = async () => {
        if (!workspaceName) return;

        let error: any;

        const updatedWorkspace = await WorkspaceService.updateWorkspaceName(
            selectedWorkspace._id,
            { name: workspaceName },
            (err) => (error = err)
        );

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

    const updateWorkspaceCustomerSettings = async () => {
        if (!workspaceCustomerSettings?.id || !workspaceCustomerSettings.email) return;

        let error: any;

        const updatedWorkspace = await WorkspaceService.updateWorkspaceCustomerSettings(
            selectedWorkspace._id,
            workspaceCustomerSettings,
            (err) => (error = err)
        );

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

    useEffect(() => {
        setWorkspaceName(selectedWorkspace.name);
    }, [selectedWorkspace.name]);

    useEffect(() => {
        setWorkspaceCustomerSettings({
            id: selectedWorkspace.customerXSettings?.id || '',
            email: selectedWorkspace.customerXSettings?.email || '',
        });
    }, [selectedWorkspace.customerXSettings?.email, selectedWorkspace.customerXSettings?.id]);

    useEffect(() => {
        setSongValue(selectedWorkspace.generalConfigs?.notificationSong || NotificationSongs.OPTION_1);
    }, [selectedWorkspace.generalConfigs?.notificationSong]);

    useEffect(() => {
        setEnableEditProfileAllUsers(selectedWorkspace.generalConfigs?.enableEditProfileAllUsers ?? false);
    }, [selectedWorkspace.generalConfigs?.enableEditProfileAllUsers]);

    const handleSoundSelect = (value) => {
        setSongValue(value);
    };

    const handlePlayButtonClick = () => {
        const audio = new Audio(`/assets/media/${songValue}.mp3`);
        audio.play();
    };

    const visibleWorkspaceButton =
        selectedWorkspace.name?.trim() !== workspaceName?.trim() && workspaceName?.trim().length > 3;

    const visibleWorkspaceSettingButton =
        (workspaceCustomerSettings?.id && selectedWorkspace.customerXSettings?.id !== workspaceCustomerSettings?.id) ||
        (workspaceCustomerSettings?.email &&
            selectedWorkspace.customerXSettings?.email !== workspaceCustomerSettings?.email);

    const visibleWorkspaceSongButton =
        songValue !== selectedWorkspace.generalConfigs?.notificationSong ||
        !selectedWorkspace.generalConfigs.notificationSong;

    const visibleEnableCampaignButton =
        enableCampaignAllUsers !== !!selectedWorkspace.generalConfigs?.enableCampaignAllUsers;

    const visibleEnableEditProfileButton =
        enableEditProfileAllUsers !== !!selectedWorkspace.generalConfigs?.enableEditProfileAllUsers;

    const visibleEnableAutomaticShipmentsButton =
        enableAutomaticSendingListAllUsers !== !!selectedWorkspace.generalConfigs?.enableAutomaticSendingListAllUsers;

    const visibleEnableIndividualCancelInConfirmation =
        enableIndividualCancelInConfirmation !==
        !!selectedWorkspace.generalConfigs?.enableIndividualCancelInConfirmation;

    const visibleAutoCompleteTemplateVariables =
        enableAutoCompleteTemplateVariables !== !!selectedWorkspace.generalConfigs?.enableAutoCompleteTemplateVariables;

    const visibleEnableAgentsTeamHistoryAccess =
        enableAgentsTeamHistoryAccess !== !!selectedWorkspace.generalConfigs?.enableAgentsTeamHistoryAccess;

    const visibleEnableConcatAgentNameInMessage =
        enableConcatAgentNameInMessage !== !!selectedWorkspace.generalConfigs?.enableConcatAgentNameInMessage;
    const visibleIgnoreUserFollowupConversation =
        enableIgnoreUserFollowupConversation !==
        !!selectedWorkspace.generalConfigs?.enableIgnoreUserFollowupConversation;

    // const visibleEnableReply = enableReply !== !!selectedWorkspace.generalConfigs?.enableReply;

    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    return (
        <>
            <Wrapper>
                <Header title={getTranslation('General Settings')}> </Header>
            </Wrapper>
            <ScrollView id='content-general-settings'>
                <Wrapper padding='20px 30px' maxWidth='1100px' margin='0 auto'>
                    {isSystemAdmin(loggedUser) && (
                        <div style={{ margin: '0 0 30px 0' }}>
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
                                header={'Workspace'}
                            >
                                <SettingsItem
                                    title={getTranslation('Customer name')}
                                    description={getTranslation(
                                        'The chosen name will help to better identify and organize the workspace that will appear on the platform'
                                    )}
                                >
                                    <Input
                                        value={workspaceName}
                                        onChange={(e) => setWorkspaceName(e.target.value)}
                                        maxLength={200}
                                        // readOnly={!canEditWorkspaceName}
                                    />

                                    <Button
                                        style={{ float: 'right', margin: '5px 0 0 0' }}
                                        type='primary'
                                        size='small'
                                        disabled={!visibleWorkspaceButton}
                                        className='antd-span-default-color'
                                        onClick={updateWorkspaceName}
                                    >
                                        {getTranslation('Confirm')}
                                    </Button>
                                </SettingsItem>
                            </Card>
                        </div>
                    )}
                    {(isSystemCsAdmin(loggedUser) || isSystemDevAdmin(loggedUser)) && (
                        <div style={{ margin: '0 0 30px 0' }}>
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
                                header={'Tracking send settings for CustomerX integration'}
                            >
                                <SettingsItem
                                    title={getTranslation('Customer ID')}
                                    description={getTranslation('Customer ID on the CustomerX platform')}
                                >
                                    <Input
                                        value={workspaceCustomerSettings?.id}
                                        onChange={(e) =>
                                            setWorkspaceCustomerSettings((prevState) => ({
                                                id: e.target.value,
                                                email: prevState?.email || '',
                                            }))
                                        }
                                        maxLength={200}
                                    />
                                </SettingsItem>
                                <SettingsItem
                                    title={getTranslation('Customer email')}
                                    description={getTranslation(
                                        'Email of one of the customer’s contacts on the CustomerX platform'
                                    )}
                                >
                                    <Input
                                        value={workspaceCustomerSettings?.email}
                                        onChange={(e) =>
                                            setWorkspaceCustomerSettings((prevState) => ({
                                                id: prevState?.id || '',
                                                email: e.target.value,
                                            }))
                                        }
                                        maxLength={200}
                                    />

                                    <Button
                                        style={{ float: 'right', margin: '5px 0 0 0' }}
                                        type='primary'
                                        size='small'
                                        disabled={!visibleWorkspaceSettingButton}
                                        className='antd-span-default-color'
                                        onClick={updateWorkspaceCustomerSettings}
                                    >
                                        {getTranslation('Confirm')}
                                    </Button>
                                </SettingsItem>
                            </Card>
                        </div>
                    )}
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
                        header={'Atendimentos'}
                    >
                        <SettingsItem
                            title={getTranslation('Notification sound')}
                            description={getTranslation(
                                'When a new service appears, emit a sound for those who are logged in'
                            )}
                        >
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <Button shape='circle' onClick={handlePlayButtonClick}>
                                    <AiOutlineSound />
                                </Button>
                                <Select value={songValue} style={{ width: 220 }} onChange={handleSoundSelect}>
                                    <Option value={NotificationSongs.OPTION_1}>{`${getTranslation('Sound')} 1`}</Option>
                                    <Option value={NotificationSongs.OPTION_2}>{`${getTranslation('Sound')} 2`}</Option>
                                    <Option value={NotificationSongs.OPTION_3}>{`${getTranslation('Sound')} 3`}</Option>
                                    <Option value={NotificationSongs.OPTION_4}>{`${getTranslation('Sound')} 4`}</Option>
                                </Select>
                            </div>
                            <Button
                                size='small'
                                style={{ float: 'right', margin: '5px 0 0 0' }}
                                type='primary'
                                disabled={!visibleWorkspaceSongButton}
                                className='antd-span-default-color'
                                onClick={() => {
                                    const newWorkspace: Workspace = {
                                        ...selectedWorkspace,
                                        name: workspaceName,
                                        generalConfigs: getUpdatedGeneralConfigs({
                                            notificationSong: songValue,
                                        }),
                                    };
                                    updateWorkspace(newWorkspace);
                                }}
                            >
                                {getTranslation('Confirm')}
                            </Button>
                        </SettingsItem>
                    </Card>
                    <div style={{ margin: '30px 0 30px 0' }}>
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
                            header={getTranslation('Prevent reopening of an appointment after a closing message')}
                        >
                            <SettingsItem
                                title={getTranslation(
                                    'Confirmation before reopening an appointment that has been closed'
                                )}
                                description={
                                    <>
                                        {getTranslation(
                                            'When this setting is enabled, the bot will send three options to the patient if they send a message after the end of an appointment. The bot will provide the patient with the following options:'
                                        )}
                                        <br />
                                        {getTranslation(
                                            '1. Yes: the patient wants to return to the previous appointment (requires the reassign feature to be enabled for the team);'
                                        )}
                                        <br />
                                        {getTranslation('2. No: the patient will continue the bot’s normal flow;')}
                                        <br />
                                        {getTranslation('3. End: the patient wants to close the appointment.')}
                                    </>
                                }
                            >
                                <div style={{ display: 'flex', gap: '20px', height: '100%', alignItems: 'center' }}>
                                    <Switch
                                        checked={enableIgnoreUserFollowupConversation}
                                        onChange={() => {
                                            setEnableIgnoreUserFollowupConversation(
                                                !enableIgnoreUserFollowupConversation
                                            );
                                        }}
                                    />
                                    <Button
                                        size='small'
                                        type='primary'
                                        disabled={!visibleIgnoreUserFollowupConversation}
                                        className='antd-span-default-color'
                                        onClick={() => {
                                            const newWorkspace: Workspace = {
                                                ...selectedWorkspace,
                                                name: workspaceName,
                                                generalConfigs: getUpdatedGeneralConfigs({
                                                    enableIgnoreUserFollowupConversation:
                                                        enableIgnoreUserFollowupConversation,
                                                }),
                                            };
                                            updateWorkspace(newWorkspace);
                                        }}
                                    >
                                        {getTranslation('Confirm')}
                                    </Button>
                                </div>
                            </SettingsItem>
                        </Card>
                    </div>
                    <div style={{ margin: '30px 0 30px 0' }}>
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
                            header={getTranslation('Profile configuration')}
                        >
                            <SettingsItem
                                title={getTranslation('Block permission to edit agent profile')}
                                description={getTranslation(
                                    'When enabling, the user will not be able to edit profile information'
                                )}
                            >
                                <div style={{ display: 'flex', gap: '20px', height: '100%', alignItems: 'center' }}>
                                    <Switch
                                        checked={enableEditProfileAllUsers}
                                        onChange={() => {
                                            setEnableEditProfileAllUsers(!enableEditProfileAllUsers);
                                        }}
                                    />
                                    <Button
                                        size='small'
                                        type='primary'
                                        disabled={!visibleEnableEditProfileButton}
                                        className='antd-span-default-color'
                                        onClick={() => {
                                            const newWorkspace: Workspace = {
                                                ...selectedWorkspace,
                                                name: workspaceName,
                                                generalConfigs: getUpdatedGeneralConfigs({
                                                    enableEditProfileAllUsers: enableEditProfileAllUsers,
                                                }),
                                            };
                                            updateWorkspace(newWorkspace);
                                        }}
                                    >
                                        {getTranslation('Confirm')}
                                    </Button>
                                </div>
                            </SettingsItem>
                        </Card>
                    </div>
                    {selectedWorkspace?.featureFlag?.campaign && (
                        <div style={{ margin: '30px 0 30px 0' }}>
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
                                header={getTranslation('Broadcast list')}
                            >
                                <SettingsItem
                                    title={getTranslation('User access to the broadcast list')}
                                    description={getTranslation('All users will have access to the broadcast list')}
                                >
                                    <div style={{ display: 'flex', gap: '20px', height: '100%', alignItems: 'center' }}>
                                        <Switch
                                            checked={enableCampaignAllUsers}
                                            onChange={() => {
                                                setEnableCampaignAllUsers(!enableCampaignAllUsers);
                                            }}
                                        />
                                        <Button
                                            size='small'
                                            type='primary'
                                            disabled={!visibleEnableCampaignButton}
                                            className='antd-span-default-color'
                                            onClick={() => {
                                                const newWorkspace: Workspace = {
                                                    ...selectedWorkspace,
                                                    name: workspaceName,
                                                    generalConfigs: getUpdatedGeneralConfigs({
                                                        enableCampaignAllUsers: enableCampaignAllUsers,
                                                    }),
                                                };
                                                updateWorkspace(newWorkspace);
                                            }}
                                        >
                                            {getTranslation('Confirm')}
                                        </Button>
                                    </div>
                                </SettingsItem>
                            </Card>
                        </div>
                    )}
                    {selectedWorkspace?.featureFlag?.enableConfirmation && (
                        <>
                            <div style={{ margin: '30px 0 30px 0' }}>
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
                                    header={getTranslation('Automatic sending')}
                                >
                                    <SettingsItem
                                        title={getTranslation('User access to the automatic sending list')}
                                        description={getTranslation(
                                            'All users will have access to the list of sending'
                                        )}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '20px',
                                                height: '100%',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Switch
                                                checked={enableAutomaticSendingListAllUsers}
                                                onChange={() => {
                                                    setEnableAutomaticSendingListAllUsers(
                                                        !enableAutomaticSendingListAllUsers
                                                    );
                                                }}
                                            />
                                            <Button
                                                size='small'
                                                type='primary'
                                                disabled={!visibleEnableAutomaticShipmentsButton}
                                                className='antd-span-default-color'
                                                onClick={() => {
                                                    const newWorkspace: Workspace = {
                                                        ...selectedWorkspace,
                                                        name: workspaceName,
                                                        generalConfigs: getUpdatedGeneralConfigs({
                                                            enableAutomaticSendingListAllUsers:
                                                                enableAutomaticSendingListAllUsers,
                                                        }),
                                                    };
                                                    updateWorkspace(newWorkspace);
                                                }}
                                            >
                                                {getTranslation('Confirm')}
                                            </Button>
                                        </div>
                                    </SettingsItem>
                                </Card>
                            </div>
                            <div style={{ margin: '30px 0 30px 0' }}>
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
                                    header={getTranslation('Active confirmation')}
                                >
                                    <SettingsItem
                                        title={getTranslation('Flow activation for individual cancellation')}
                                        description={getTranslation(
                                            'For active confirmation sends with more than one appointment, you can cancel each appointment individually'
                                        )}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '20px',
                                                height: '100%',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Switch
                                                checked={enableIndividualCancelInConfirmation}
                                                onChange={() => {
                                                    setEnableIndividualCancelInConfirmation(
                                                        !enableIndividualCancelInConfirmation
                                                    );
                                                }}
                                            />
                                            <Button
                                                size='small'
                                                type='primary'
                                                disabled={!visibleEnableIndividualCancelInConfirmation}
                                                className='antd-span-default-color'
                                                onClick={() => {
                                                    const newWorkspace: Workspace = {
                                                        ...selectedWorkspace,
                                                        name: workspaceName,
                                                        generalConfigs: getUpdatedGeneralConfigs({
                                                            enableIndividualCancelInConfirmation:
                                                                enableIndividualCancelInConfirmation,
                                                        }),
                                                    };
                                                    updateWorkspace(newWorkspace);
                                                }}
                                            >
                                                {getTranslation('Confirm')}
                                            </Button>
                                        </div>
                                    </SettingsItem>
                                </Card>
                            </div>
                        </>
                    )}
                    <div style={{ margin: '30px 0 30px 0' }}>
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
                            header={getTranslation('Autocomplete suggestion for template variables')}
                        >
                            <SettingsItem
                                title={getTranslation('Activation of autocomplete suggestion')}
                                description={getTranslation(
                                    'When filling out a template with a variable, the value will be saved and shown to the agent as an autocomplete suggestion in the corresponding field'
                                )}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '20px',
                                        height: '100%',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Switch
                                        checked={enableAutoCompleteTemplateVariables}
                                        onChange={() => {
                                            setEnableAutoCompleteTemplateVariables(
                                                !enableAutoCompleteTemplateVariables
                                            );
                                        }}
                                    />
                                    <Button
                                        size='small'
                                        type='primary'
                                        disabled={!visibleAutoCompleteTemplateVariables}
                                        className='antd-span-default-color'
                                        onClick={() => {
                                            const newWorkspace: Workspace = {
                                                ...selectedWorkspace,
                                                name: workspaceName,
                                                generalConfigs: getUpdatedGeneralConfigs({
                                                    enableAutoCompleteTemplateVariables:
                                                        enableAutoCompleteTemplateVariables,
                                                }),
                                            };
                                            updateWorkspace(newWorkspace);
                                        }}
                                    >
                                        {getTranslation('Confirm')}
                                    </Button>
                                </div>
                            </SettingsItem>
                        </Card>
                    </div>
                    <div style={{ margin: '30px 0 30px 0' }}>
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
                            header={getTranslation('Allow all users to view the attendance history of all teams')}
                        >
                            <SettingsItem
                                title={getTranslation(
                                    'When enabled, all users will have access to the attendance history of all teams'
                                )}
                                description={getTranslation(
                                    'When this button is enabled, the specific permission of each team "view only the conversation history of this team" will no longer be applied. This means that when enabled, all users will be able to access the attendance history of all teams, regardless of whether they are part of them'
                                )}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '20px',
                                        height: '100%',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Switch
                                        checked={enableAgentsTeamHistoryAccess}
                                        onChange={() => {
                                            setEnableAgentsTeamHistoryAccess(!enableAgentsTeamHistoryAccess);
                                        }}
                                    />
                                    <Button
                                        size='small'
                                        type='primary'
                                        disabled={!visibleEnableAgentsTeamHistoryAccess}
                                        className='antd-span-default-color'
                                        onClick={() => {
                                            const newWorkspace: Workspace = {
                                                ...selectedWorkspace,
                                                name: workspaceName,
                                                generalConfigs: getUpdatedGeneralConfigs({
                                                    enableAgentsTeamHistoryAccess: enableAgentsTeamHistoryAccess,
                                                }),
                                            };
                                            updateWorkspace(newWorkspace);
                                        }}
                                    >
                                        {getTranslation('Confirm')}
                                    </Button>
                                </div>
                            </SettingsItem>
                        </Card>
                    </div>
                    <div style={{ margin: '30px 0 30px 0' }}>
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
                            header={getTranslation('Agent name in message')}
                        >
                            <SettingsItem
                                title={getTranslation('Include agent name in messages')}
                                description={getTranslation(
                                    'When enabled, all messages sent by agents (including templates) will have the username at the beginning of the message.'
                                )}
                            >
                                <div style={{ display: 'flex', gap: '20px', height: '100%', alignItems: 'center' }}>
                                    <Switch
                                        checked={enableConcatAgentNameInMessage}
                                        onChange={() => {
                                            setEnableConcatAgentNameInMessage(!enableConcatAgentNameInMessage);
                                        }}
                                    />
                                    <Button size='small' onClick={() => setPreviewVisible(true)}>
                                        {getTranslation('Preview')}
                                    </Button>
                                    <Button
                                        size='small'
                                        type='primary'
                                        disabled={!visibleEnableConcatAgentNameInMessage}
                                        className='antd-span-default-color'
                                        onClick={() => {
                                            const newWorkspace: Workspace = {
                                                ...selectedWorkspace,
                                                name: workspaceName,
                                                generalConfigs: getUpdatedGeneralConfigs({
                                                    enableConcatAgentNameInMessage: enableConcatAgentNameInMessage,
                                                }),
                                            };
                                            updateWorkspace(newWorkspace);
                                        }}
                                    >
                                        {getTranslation('Confirm')}
                                    </Button>
                                </div>
                            </SettingsItem>
                        </Card>
                    </div>
                </Wrapper>
            </ScrollView>
            <Modal open={previewVisible} onCancel={() => setPreviewVisible(false)} footer={null} centered>
                <ActivityPreview
                    message={`<strong>João Da Silva:</strong><br/><br/>Olá!<br/>Podemos falar por aqui?`}
                />
            </Modal>
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
        })(GeneralSettings)
    )
);
