import { Helmet } from 'react-helmet';
import { Constants } from '../../utils/Constants';
import { isSystemCsAdmin, isWorkspaceAdmin } from '../../utils/UserPermission';
import { HelmetInjectionProps } from './interfaces';

const HelmetInjection = ({ cxExternalEmail, cxExternalId, loggedUser, workspaceId }: HelmetInjectionProps) => {
    if (!loggedUser?._id || !loggedUser?.name || !workspaceId) return null;

    const isSystemCs = isSystemCsAdmin(loggedUser);
    const isWorkspaceSupervisor = isWorkspaceAdmin(loggedUser, workspaceId);
    const shouldInjectSurveyScript =
        Boolean(cxExternalEmail) && Boolean(cxExternalId) && Boolean(Constants.CX_CREDENCIAL);

    const scriptClarity = `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){
        (c[a].q=c[a].q||[]).push(arguments)
      };
      t=l.createElement(r);
      t.async=1;
      t.src="https://www.clarity.ms/tag/"+i;
      t.setAttribute('data-uid', '${loggedUser?._id}');
      t.setAttribute('data-name', '${loggedUser?.name}');
      y=l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t,y);
      })(window,document,"clarity","script","fvs687tgye");
     `;

//     const scriptSurveyCustomerX = `
//     (function(i,s,o,g,r,a,m,n){
//         i['CustomerXSurveyObject']=r;
//         n = r.split('.');
//         r = n[n.length - 1], i = n.slice(0, -1).reduce(function(o, p){
//             if (!o[p]) {
//                 o[p] = {};
//             }
//             return o[p];
//         }, i);
//         i[r]=i[r]||function() {
//             (i[r].q=i[r].q||[]).push(arguments)
//         },i[r].l=1*new Date();
//         a=s.createElement(o),m=s.getElementsByTagName(o)[0];
//         a.async=1;
//         a.src=g;
//         m.parentNode.insertBefore(a,m)
//     })(window,document,'script', 'https://survey-widget.customerx.com.br/embed.js', 'cx.survey')

 
//    try {
//       cx.survey('authorize', '${Constants.CX_CREDENCIAL}');
//       cx.survey('identify', {external_id_client: '${cxExternalId}',email: '${loggedUser.email}'});
//       cx.survey('start', 'nps');
//    } catch(error) {
//       console.error(error);
//    }`;

    return (
        <Helmet>
            <script type='text/javascript'>{scriptClarity}</script>
            {/* {shouldInjectSurveyScript && (isSystemCs || isWorkspaceSupervisor) && (
                <script type='text/javascript'>{scriptSurveyCustomerX}</script>
            )} */}
        </Helmet>
    );
};

export { HelmetInjection };
