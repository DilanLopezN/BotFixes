import { useInteractionsPendingPublicationContext } from '../../../contexts/interactionsPendingPublication';
import { DropAsLastChild } from './DropAsLastChild';

export const DropAsLastChildWithContext = (props) => {
    const { setInteractionsPendingPublication } = useInteractionsPendingPublicationContext();
    return <DropAsLastChild {...props} setInteractionsPendingPublication={setInteractionsPendingPublication} />;
};
