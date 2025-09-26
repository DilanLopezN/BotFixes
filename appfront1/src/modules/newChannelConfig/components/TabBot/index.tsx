import { FC, useEffect, useState } from 'react';
import { TabBotProps } from './props';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import I18n from '../../../i18n/components/i18n';
import DivisorCard from '../DivisorCard';
import { Bot } from '../../../../model/Bot';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import { StyledFormikField } from '../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { connect } from 'react-redux';
import { timeout } from '../../../../utils/Timer';
import { isSystemAdmin } from '../../../../utils/UserPermission';

const TabBot: FC<TabBotProps> = (props) => {
    const {
        getTranslation,
        values,
        setFieldValue,
        onChange,
        channel,
        selectedMenu,
        addNotification,
        loggedUser,
        workspaceList,
    } = props;

    useEffect(() => {
        if (JSON.stringify(channel) !== JSON.stringify(values.channel)) onChange(values.channel);
    }, [values.channel]);

    const [workspaceBots, setworkspaceBots] = useState<Bot[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<string>(channel.workspaceId);

    useEffect(() => {
        getWorkspaceBots(channel.workspaceId);
    }, []);

    const getWorkspaceBots = async (workspaceId: string) => {
        const botList = await WorkspaceService.getWorkspaceBots(workspaceId);
        setworkspaceBots(botList.data || []);
    };

    useEffect(() => {
        getWorkspaceBots(currentWorkspace);
        setFieldValue('channel.workspaceId', currentWorkspace);
    }, [currentWorkspace]);

    const vincule = (botId: string) => {
        setFieldValue('channel.botId', botId);
    };

    const createBot = async () => {
        let botName = `${channel.name}.${channel.channelId}`;

        if (workspaceBots.find((bot) => bot.name === botName)) {
            botName = botName + `.${Math.random().toString(36).substring(9)}`;
        }

        const created = await WorkspaceService.createBot(
            {
                workspaceId: currentWorkspace || channel.workspaceId,
                name: botName,
            } as Bot,
            channel.workspaceId
        );

        if (created && created._id) {
            setworkspaceBots((prev) => [...prev, created]);

            timeout(() => vincule(created._id), 100);

            return addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Created bot'),
                message: getTranslation('Bot successfully created'),
            });
        }
        return addNotification({
            type: 'warning',
            duration: 3000,
            title: getTranslation('Erro ao criar bot'),
            message: getTranslation('There was an error creating the bot, please try again'),
        });
    };

    const isAdmin = isSystemAdmin(loggedUser);

    return (
        <Wrapper flexBox flexDirection='column' alignItems='center' height='100%'>
            {selectedMenu.sections[0].showOnChannelIdEquals.includes(channel.channelId) && (
                <DivisorCard title={getTranslation('Linked Bot')}>
                    <Wrapper margin='0 0 10px 0'>
                        {channel.botId
                            ? getTranslation('Link a bot to your channel')
                            : getTranslation('Link a bot to your channel')}
                    </Wrapper>
                    <Wrapper alignItems='center' flexBox>
                        {isAdmin && (
                            <Wrapper margin='0 15px 0 0' width='340px'>
                                <StyledFormikField
                                    name='channel.workspaceId'
                                    component='select'
                                    onChange={(ev) => {
                                        setCurrentWorkspace(ev.target.value);
                                    }}
                                >
                                    <option value=''></option>
                                    {workspaceList.map((workspace) => {
                                        return <option value={workspace._id}>{`${workspace.name}`}</option>;
                                    })}
                                </StyledFormikField>
                            </Wrapper>
                        )}
                        <Wrapper width='340px'>
                            <StyledFormikField name='channel.botId' component='select'>
                                <option value=''></option>
                                {workspaceBots.map((bot) => {
                                    return <option value={bot._id}>{`${bot.name}`}</option>;
                                })}
                            </StyledFormikField>
                        </Wrapper>
                    </Wrapper>
                </DivisorCard>
            )}
        </Wrapper>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    workspaceList: state.workspaceReducer.workspaceList,
});

const mapDispatchToProps = (dispatch, ownProps) => {};

export default I18n(connect(mapStateToProps, mapDispatchToProps)(TabBot));
