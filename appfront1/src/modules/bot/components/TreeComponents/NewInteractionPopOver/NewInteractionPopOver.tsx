import React, { useCallback, useState } from 'react';
import ClickOutside from 'react-click-outside';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Interaction, InteractionType } from '../../../../../model/Interaction';
import BlockUi from '../../../../../shared-v2/BlockUi/BlockUi';
import { useLanguageContext } from '../../../../i18n/context';
import { useInteractionsPendingPublicationContext } from '../../../contexts/interactionsPendingPublication';
import { BotActions } from '../../../redux/actions';
import { BotService } from '../../../services/BotService';
import { FormNewContainer } from '../FormNewContainer/FormNewInteration';
import { FormNewInteraction } from '../FormNewInteraction/FormNewInteration';
import { FormNewInteractionReference } from '../FormNewInteractionReference/FormNewInteractionReference';
import './NewInteractionPopover.scss';
import { NewInteractionPopoverProps, NewInteractionType } from './NewInteractionPopoverProps';
import { usePendingInteraction } from './use-pending-interaction';

export const NewInteractionPopover: React.FC<NewInteractionPopoverProps> = (props) => {
    const [selectedType, setSelectedType] = useState<NewInteractionType | undefined>(undefined);
    const { workspaceId = '', botId = '' } = useParams<{ workspaceId: string; botId: string }>();
    const [isOpened, setIsOpened] = useState(props.isOpened);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useDispatch();
    const { getTranslation } = useLanguageContext();
    const { fetchPendingInteraction } = usePendingInteraction();
    const interactionList = useSelector((state: any) => state.botReducer.interactionList);
    const setType = (type: NewInteractionType) => {
        setSelectedType(type);
    };
    const { setInteractionsPendingPublication } = useInteractionsPendingPublicationContext();

    const getPosition = useCallback(() => {
        const siblingList = interactionList?.filter((interaction) => interaction.parentId === props.interaction._id);
        const lastSibling = siblingList[siblingList.length - 1];
        let position = 5000;

        if (lastSibling && lastSibling.position) {
            position = lastSibling.position * 2;
        }

        if (siblingList.length === 0 && !props.interaction.parentId) {
            const welcomeInteractions = interactionList?.filter(
                (interaction) =>
                    (interaction.type === 'interaction' || interaction.type === 'container') && !interaction.parentId
            );

            if (welcomeInteractions.length > 0) {
                const lastInteraction =
                    welcomeInteractions[welcomeInteractions.length > 1 ? welcomeInteractions.length - 1 : 0];

                if (lastInteraction) {
                    position = lastInteraction.position * 2;
                }
            }
        }

        return position;
    }, [props.interaction, interactionList]);

    const onSubmit = async (interaction: Interaction) => {
        setIsSubmitting(true);

        if (props.interaction.type !== 'welcome') {
            interaction.parentId = props.interaction._id;
        }

        interaction.position = getPosition();
        const response: Interaction = await BotService.createInteraction(workspaceId, botId, interaction);
        setInteractionsPendingPublication((prevInteractions) => [...prevInteractions, response]);
        fetchPendingInteraction();
        const newInteractionList = [...interactionList, response];

        dispatch(BotActions.setInteractionList(newInteractionList));

        setIsSubmitting(false);
    };

    const createContextFallback = () => {
        const interaction: Interaction = {
            type: InteractionType.contextFallback,
        } as Interaction;
        onSubmit(interaction);
    };

    const renderInteractionForm = () => (
        <BlockUi blocking={isSubmitting}>
            <FormNewInteraction onSubmit={onSubmit} />
        </BlockUi>
    );

    const renderContainerForm = () => (
        <BlockUi blocking={isSubmitting}>
            <FormNewContainer onSubmit={onSubmit} />
        </BlockUi>
    );

    const renderReferenceForm = () => (
        <BlockUi blocking={isSubmitting}>
            <FormNewInteractionReference
                interaction={props.interaction}
                interactionList={interactionList}
                onSubmit={onSubmit}
            />
        </BlockUi>
    );

    const renderOptions = () => {
        return (
            <div className='btn-group-vertical'>
                <button
                    type='button'
                    className='btn btn-outline-primary'
                    onClick={() => setType(NewInteractionType.INTERACTION)}
                >
                    {getTranslation('Interaction')}
                </button>
                <button
                    type='button'
                    className='btn btn-outline-primary'
                    onClick={() => setType(NewInteractionType.REFERENCE)}
                >
                    {getTranslation('Reference')}
                </button>
                <button
                    type='button'
                    className='btn btn-outline-primary'
                    onClick={() => setType(NewInteractionType.CONTAINER)}
                >
                    {getTranslation('Container')}
                </button>
                <button
                    type='button'
                    className='btn btn-outline-primary'
                    disabled={props.hasFallback}
                    onClick={createContextFallback}
                >
                    {getTranslation('Fallback context')}
                </button>
            </div>
        );
    };

    const formWrapper = (nodeToRender: () => JSX.Element) => <div className='form-wrapper'>{nodeToRender()}</div>;

    const getPopoverContent = () => {
        if (!selectedType) return renderOptions();
        if (selectedType === NewInteractionType.INTERACTION) return formWrapper(renderInteractionForm);
        if (selectedType === NewInteractionType.CONTAINER) return formWrapper(renderContainerForm);
        if (selectedType === NewInteractionType.REFERENCE) return formWrapper(renderReferenceForm);
    };

    const close = () => {
        setIsOpened(false);
    };

    const renderPopover = () => (
        <ClickOutside onClickOutside={close}>
            <div className='new-interaction-popover'>{getPopoverContent()}</div>
        </ClickOutside>
    );

    return isOpened ? renderPopover() : null;
};
