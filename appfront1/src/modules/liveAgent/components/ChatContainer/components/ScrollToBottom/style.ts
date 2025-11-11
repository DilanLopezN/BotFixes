import styled from 'styled-components';

const ButtonWrapper = styled.div<{ visible: boolean }>`
    position: absolute;
    bottom: 98px;
    right: 30px;
    z-index: 5;
    opacity: ${(props) => (props.visible ? 1 : 0)};
    transform: ${(props) => (props.visible ? 'translateY(0)' : 'translateY(20px)')};
    transition: all 0.3s ease;
    pointer-events: ${(props) => (props.visible ? 'auto' : 'none')};
`;

const ScrollButton = styled.button`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #59a3d6;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s;
    position: relative;

    &:hover {
        background: #4a8fc4;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:active {
        transform: translateY(0);
    }
`;

const Badge = styled.div`
    position: absolute;
    top: -5px;
    right: -5px;
    background: #e63517;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

export { ButtonWrapper, ScrollButton, Badge };
