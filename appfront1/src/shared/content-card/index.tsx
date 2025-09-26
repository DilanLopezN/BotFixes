import { FC } from 'react';
import { Content } from './styled';

interface ContentCardProps {
    selected: boolean;
    disabled: boolean;
    clickable: boolean;
    onClick: (params) => void;
    children?: React.ReactNode;
 }

const ContentCard: FC<ContentCardProps> = ({
    children,
    selected,
    disabled,
    clickable,
    onClick
}) => {

    return (
        <Content
            selected={selected}
            disabled={disabled}
            clickable={clickable}
            onClick={onClick}
        >
            {children}
        </Content>
    )
};

export default ContentCard as FC<ContentCardProps>;
