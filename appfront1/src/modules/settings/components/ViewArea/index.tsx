import { FC } from 'react';
import { ViewAreaProps } from './props';

const ViewArea: FC<ViewAreaProps> = ({ menuSelected, addNotification, selectedWorkspace, loggedUser, match }) => {
    if (!menuSelected || !menuSelected.component) return null;

    const Component = menuSelected.component;

    return (
        <Component
            addNotification={addNotification}
            menuSelected={menuSelected}
            workspaceId={selectedWorkspace._id}
            selectedWorkspace={selectedWorkspace}
            loggedUser={loggedUser}
            match={match}
        />
    );
};

export default ViewArea;
