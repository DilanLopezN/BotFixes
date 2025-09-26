import { FC } from 'react';
import styled from 'styled-components';
import { ButtonProps } from './props';
import { Icon } from '..';
import { getColor, ColorType, ColorVariation } from '../../theme';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const StyledButton = styled.div<any>`
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    cursor: ${(props) => (!!props.disabled || !!props.loading ? `initial` : `pointer`)};
    border-radius: 0.3rem;
    margin-bottom: 0;
    font-size: 1rem;
    text-align: center;
    white-space: ${(props) => props.whiteSpace || 'nowrap'};
    user-select: none;
    ${(props) =>
        !!props.disabled &&
        `
        opacity: 0.5;
    `}
    background: ${(props) =>
        !props.outline
            ? !!props.active
                ? props.colorType
                    ? getColor(props.colorType, ColorVariation.dark)
                    : '#0068D8'
                : getColor(props.colorType || ColorType.primary)
            : '#FFF'};
    color: ${(props) => (!props.outline ? '#FFF' : getColor(props.colorType || ColorType.primary))};
    border: 1px solid ${(props) => (!props.outline ? '#CED4DA' : getColor(props.colorType || ColorType.primary))};
    padding: ${(props) => (!!props.padding ? props.padding : '0 8px')};
    width: ${(props) => (!!props.width ? props.width : 'max-content')};
    ${(props) =>
        !!props.margin &&
        `
        margin: ${props.margin};
    `};
    ${(props) =>
        !!props.minWidth &&
        `
        min-width: ${props.minWidth};
    `};
    ${(props) =>
        !!props.minHeight &&
        `
        min-height: ${props.minHeight};
    `};

    ${(props) =>
        !props.minHeight &&
        !props.height &&
        `
        height: ${(props) => (!props.height && !props.minHeight ? '40px' : props.height)};
    `};
    ${(props) => (!props.minHeight && !props.height ? `height: 36px;` : !!props.height && `height: ${props.height};`)};
    font-size: ${(props) => (!!props.fontSize ? props.fontSize : '13px')};
    animation: all 500ms;
    ${(props) =>
        props.loading &&
        `
        pointer-events: none;
    `}
`;

const Loader = styled.div`
    position: absolute;
    right: 0;
    left: 0;
    bottom: 0;
    top: 0%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 10px 0 0;
    background: #9b9b9b5e;
    pointer-events: none;
    animation: all 500ms;
    z-index: 99;
`;

const Spin = styled(AiOutlineLoading3Quarters)`
    @keyframes rotation {
        from {
            -webkit-transform: rotate(0deg);
        }
        to {
            -webkit-transform: rotate(359deg);
        }
    }

    font-size: 24px;
    animation: rotation 900ms infinite linear;
    color: #fff;
`;

const PrimaryButton: FC<ButtonProps> = ({
    id,
    width,
    minWidth,
    height,
    minHeight,
    padding,
    margin,
    className,
    outline,
    active,
    icon,
    onClick,
    children,
    colorType,
    fontSize,
    disabled,
    style,
    whiteSpace,
    loading,
    title,
}) => {
    const wrapProps = {
        id,
        outline,
        active,
        width,
        height,
        minHeight,
        minWidth,
        padding,
        margin,
        onClick,
        className,
        colorType,
        fontSize,
        disabled,
        style,
        whiteSpace,
        loading,
        title,
    };

    const content = (
        <>
            {children}
            {icon && (
                <Icon
                    name={icon}
                    size='12px'
                    margin={children ? '0 0 0 8px' : '0'}
                    color={getColor(colorType, !outline ? ColorVariation.contrast : undefined)}
                />
            )}
        </>
    );

    if (wrapProps.onClick) {
        wrapProps.onClick = !loading ? onClick : undefined;
    }
    if (disabled) {
        wrapProps.onClick = () => {};
    } else {
        wrapProps.onClick = onClick;
    }
    return (
        <StyledButton {...wrapProps}>
            {loading && (
                <Loader>
                    <Spin />
                </Loader>
            )}
            {content}
        </StyledButton>
    );
};

export default PrimaryButton;
