import { Link } from 'react-router-dom';
import { MenuLinkProps } from './interfaces';
import { Container } from './styles';

const MenuLink = ({ to, isAbsolutePath, children }: MenuLinkProps) => {
    if (isAbsolutePath) {
        return (
            <Container>
                <a href={to}>{children}</a>
            </Container>
        );
    }
    return (
        <Container>
            <Link to={to}>{children}</Link>
        </Container>
    );
};
export { MenuLink };
