import { FC, useEffect, useState } from 'react';
import RedirectForInteraction from '../../../../../../../../../../shared/RedirectForInteraction';
import { SimpleSelect } from '../../../../../../../../../../shared/SimpleSelect/SimpleSelect';
import { InteractionSelect } from '../../../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { LabelWrapper } from '../../../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Wrapper } from '../../../../../../../../../../ui-kissbot-v2/common';
import { BotService } from '../../../../../../../../../bot/services/BotService';
import I18n from '../../../../../../../../../i18n/components/i18n';
import { WorkspaceService } from '../../../../../../../../../workspace/services/WorkspaceService';
import MenuLeftActions from '../MenuLeftActions';
import { FlowGoToCardProps } from './props';

const FlowGoToCard: FC<FlowGoToCardProps> = ({
    touched,
    errors,
    isSubmitted,
    setFieldValue,
    getTranslation,
    values,
    index,
    onDeleteAction,
    workspaceList,
    workspaceId,
    validation,
}) => {
    const actionsGoTo: any[] = values;
    const [bots, setBots] = useState<any[]>([]);
    const [interactions, setInteractions] = useState<any[]>([]);

    const getBotsWorkspace = async (workspaceId: string) => {
        const workspaceBots = await WorkspaceService.getWorkspaceBots(workspaceId);
        setBots(workspaceBots?.data);
    };

    const getInteractions = async (workspaceId: string, botId: string) => {
        const interactionsList = await BotService.getInteractions(workspaceId, botId);
        setInteractions(interactionsList.data);
    };

    useEffect(() => {
        if (workspaceId) {
            getBotsWorkspace(workspaceId);
        }
    }, [workspaceId]);

    useEffect(() => {
        if (workspaceId && actionsGoTo[index]?.element?.botId) {
            getInteractions(workspaceId, actionsGoTo[index].element.botId);
        }
    }, [workspaceId, actionsGoTo, index]);
    return (
        <Wrapper margin='0 0 -50px 0'>
            <Wrapper fontSize='16px' margin='10px 45px -60px' width='90%'>
                {getTranslation('Goto')}
            </Wrapper>
            <MenuLeftActions
                values={values}
                index={index}
                onchange={(actions) => setFieldValue(`actions`, actions)}
                onDeleteAction={onDeleteAction}
            />
            <Wrapper
                position='relative'
                top='-65px'
                margin='15px 20px 15px 45px'
                width='90%'
                padding='15px'
                borderRadius='5px'
                border='1px #e2e2e2 solid'
                bgcolor='#f7f7f7'
                borderBottom='1px #ddd solid'
            >
                {bots.length > 0 && (
                    <LabelWrapper
                        label={getTranslation('Choose a bot')}
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'botId',
                        }}
                    >
                        <SimpleSelect
                            onChange={(event) => {
                                event.preventDefault();
                                if (event.target.value !== '') {
                                    getInteractions(actionsGoTo[index].element.workspaceId, event.target.value);
                                    setFieldValue(`actions[${index}].element.botId`, event.target.value);
                                }
                            }}
                            value={actionsGoTo[index].element.botId}
                        >
                            <option value=''>{getTranslation('Choose a bot')}</option>
                            {bots.map((bot) => {
                                return (
                                    <option value={bot._id} key={bot._id}>
                                        {bot.name}
                                    </option>
                                );
                            })}
                        </SimpleSelect>
                        {validation[index] === false && actionsGoTo[index].element.botId === '' && (
                            <div style={{ color: 'red', fontSize: '12px' }}>
                                {getTranslation('This field is required')}
                            </div>
                        )}
                    </LabelWrapper>
                )}

                {interactions.length > 0 && (
                    <LabelWrapper
                        label={
                            <>
                                {getTranslation('Choose an interaction')}
                                <RedirectForInteraction
                                    workspaceId={workspaceId}
                                    botId={actionsGoTo[index].element.botId}
                                    interactionId={actionsGoTo[index].element.value}
                                />
                            </>
                        }
                        validate={{
                            touched,
                            errors,
                            isSubmitted: isSubmitted,
                            fieldName: 'interaction',
                        }}
                    >
                        <InteractionSelect
                            placement='auto'
                            options={(interactions && interactions) || []}
                            interactionTypeToShow={['interaction', 'welcome', 'fallback']}
                            defaultValue={actionsGoTo[index].element.value}
                            placeholder={getTranslation('Select a interaction')}
                            onChange={(event) => {
                                if (!event) return;
                                if (event.value !== '') {
                                    setFieldValue(`actions[${index}].element.value`, event.value);
                                }
                            }}
                        />
                        {validation[index] === false && actionsGoTo[index].element.value === '' && (
                            <div style={{ color: 'red', fontSize: '12px' }}>
                                {getTranslation('This field is required')}
                            </div>
                        )}
                    </LabelWrapper>
                )}
            </Wrapper>
        </Wrapper>
    );
};

export default I18n(FlowGoToCard);
