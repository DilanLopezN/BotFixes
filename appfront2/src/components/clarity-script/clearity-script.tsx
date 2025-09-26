import { Helmet } from 'react-helmet';
import { ClarityScriptProps } from './interfaces';

export const ClarityScript = ({
  userId,
  userName,
  workspaceId,
  workspaceName,
}: ClarityScriptProps) => {
  const scriptText = `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){
        (c[a].q=c[a].q||[]).push(arguments)
      };
      t=l.createElement(r);
      t.async=1;
      t.src="https://www.clarity.ms/tag/"+i;
      t.setAttribute('data-uid', '${userId}');
      t.setAttribute('data-name', '${userName}');
      t.setAttribute('data-workspace-id', '${workspaceId}');
      t.setAttribute('data-workspace-name', '${workspaceName}');
      y=l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "kj52f5mjvc");`;

  if (!userId && !userName) {
    return null;
  }

  return (
    <Helmet>
      <script type='text/javascript'>{scriptText}</script>
    </Helmet>
  );
};
