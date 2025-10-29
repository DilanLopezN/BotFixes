import { Helmet } from 'react-helmet';
import { useAuth } from '~/hooks/use-auth';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { isAnySystemAdmin, isUserAgent, isWorkspaceAdmin } from '~/utils/permissions';

export const BeamerScript = () => {
  const { user } = useAuth();
  const { _id: workspaceId } = useSelectedWorkspace() || ({} as any);

  if (!user || !workspaceId) {
    return null;
  }

  const loggedUserId = user._id;
  const defaultWorkspaceTag = `workspace-${workspaceId}`;
  let permissions = `todos;usuario-${loggedUserId};${defaultWorkspaceTag}`;

  if (isWorkspaceAdmin(user, workspaceId)) {
    const tag = 'supervisor';
    permissions += `;${tag};${defaultWorkspaceTag}-${tag}`;
  }

  if (isUserAgent(user, workspaceId)) {
    const tag = 'agente';
    permissions += `;${tag};${defaultWorkspaceTag}-${tag}`;
  }

  if (isAnySystemAdmin(user)) {
    permissions += `;administrador`;
  }

  const beamerConfig = {
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
    user_created_at: +new Date(user.createdAt),
    alert: true,
    user_id: loggedUserId,
    user_firstname: user.name,
    user_email: user.email,
  } as const;

  return (
    <Helmet>
      <script type='text/javascript' src='https://app.getbeamer.com/js/beamer-embed.js' defer />
      <script type='text/javascript'>{`var beamer_config = ${JSON.stringify(
        beamerConfig
      )};`}</script>
    </Helmet>
  );
};
