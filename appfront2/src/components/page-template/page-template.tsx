import { PageTemplateProps } from './interfaces';
import { ActionsWrapper, BodyContainer, Container, HeaderContainer, TitleHeader } from './styles';

export const PageTemplate = ({ title, actionButtons, children }: PageTemplateProps) => {
  return (
    <Container>
      <HeaderContainer>
        <TitleHeader>{title}</TitleHeader>
        <ActionsWrapper>{actionButtons}</ActionsWrapper>
      </HeaderContainer>
      <BodyContainer>{children}</BodyContainer>
    </Container>
  );
};
