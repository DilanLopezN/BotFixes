import { FC } from 'react';
import { useSelector } from 'react-redux';
import { ClosingModalWithCategorization } from './closing-modal-with-categorization';
import { DefaultClosingMessageModal } from './default-modal';
import { ClosingMessageModalProps } from './interfaces';

export const ClosingMessageModal: FC<ClosingMessageModalProps> = (props) => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);

    if (selectedWorkspace?.userFeatureFlag?.enableConversationCategorization) {
        return <ClosingModalWithCategorization {...props} />;
    }

    return <DefaultClosingMessageModal {...props} />;
};
