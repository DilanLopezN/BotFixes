import { useInteractionsPendingPublicationContext } from '../../../contexts/interactionsPendingPublication';
import { DropAbove } from './DropAbove';

export const DropAboveWithContext = (props) => {
    const { setInteractionsPendingPublication } = useInteractionsPendingPublicationContext();
    return <DropAbove {...props} setInteractionsPendingPublication={setInteractionsPendingPublication} />;
};
