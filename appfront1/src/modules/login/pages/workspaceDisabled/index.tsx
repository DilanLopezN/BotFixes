import { FC } from 'react';
import { Content, Logo, TextInfo } from './styled';

export interface WorkspaceDisabledProps {}

const WorkspaceDisabled: FC<WorkspaceDisabledProps> = () => {
    return (
        <Content>
            <Logo src='/assets/img/bot-logo-compressed.jpg' alt='Botdesigner logo' />
            <TextInfo>
                Sua area de trabalho está desativada, entre em contato com seu supervisor para mais informações.
            </TextInfo>
        </Content>
    );
};

export default WorkspaceDisabled;
