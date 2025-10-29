import GlobalStyles from "../GlobalStyles";
import { LiveAgentPreview } from "./liveAgentPreview";
import 'antd/dist/antd.min.css';
import '@mdi/font/css/materialdesignicons.min.css';

export const Iframes = () => {
    return (
        <>
            <LiveAgentPreview />
            <GlobalStyles />
        </>
    );
};
