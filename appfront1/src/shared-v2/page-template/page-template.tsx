import { PageTemplateProps } from './interfaces';
import { ActionsWrapper, BodyContainer, Container, HeaderContainer, TitleHeader } from './styles';

export const PageTemplate = ({ title, actionButtons, children }: PageTemplateProps) => {
    const hasTitle = !!title;
    const hasActions = !!actionButtons;
    const shouldRenderHeader = hasTitle || hasActions;

    return (
        <Container>
            <HeaderContainer hasActions={!shouldRenderHeader}>
                {hasTitle && <TitleHeader>{title}</TitleHeader>}
                {hasActions && <ActionsWrapper>{actionButtons}</ActionsWrapper>}
            </HeaderContainer>

            <BodyContainer>{children}</BodyContainer>
        </Container>
    );
};
