import React from 'react';
import { Helmet } from 'react-helmet';
import { useSelector } from 'react-redux';
import { isAnySystemAdmin, isUserAgent, isWorkspaceAdmin } from '../../utils/UserPermission';
import { BeamerScriptProps } from './interfaces';

const BeamerScript: React.FC<BeamerScriptProps> = ({ workspaceId }) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    const getBeamerConfig = () => {
        const loggedUserId = loggedUser._id;
        const defaultWorkspaceTag = `workspace-${workspaceId}`;
        let permissions = `todos;usuario-${loggedUserId};${defaultWorkspaceTag}`;

        if (isWorkspaceAdmin(loggedUser, workspaceId)) {
            const tag = 'supervisor';
            permissions += `;${tag};${defaultWorkspaceTag}-${tag}`;
        }

        if (isUserAgent(loggedUser, workspaceId)) {
            const tag = 'agente';
            permissions += `;${tag};${defaultWorkspaceTag}-${tag}`;
        }

        if (isAnySystemAdmin(loggedUser)) {
            permissions += `;administrador`;
        }

        if (!permissions) {
            return null;
        }

        const beamer_config = {
            product_id: 'rFqKOTXm51679',
            selector: '.beamerTrigger',
            display: 'right',
            top: 0,
            right: 0,
            embed: false,
            button: false,
            counter: true,
            nps_delay: 20_000,
            first_visit_unread: 1,
            delay: 2000,
            button_position: null,
            language: 'PT',
            filter: permissions,
            lazy: false,
            user_created_at: +new Date(loggedUser.createdAt),
            alert: true,
            user_id: loggedUserId,
            user_firstname: loggedUser.name,
            user_email: loggedUser.email,
        };

        return beamer_config;
    };

    if (!loggedUser || !workspaceId) {
        return null;
    }

    return (
        <Helmet>
            <script type='text/javascript' src='https://app.getbeamer.com/js/beamer-embed.js' defer></script>
            <script type='text/javascript'>{`
                var beamer_config = ${JSON.stringify(getBeamerConfig())};
            `}</script>
        </Helmet>
    );
};

export { BeamerScript };
