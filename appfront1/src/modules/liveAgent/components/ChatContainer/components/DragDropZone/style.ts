import styled from 'styled-components';

const DropZoneOverlay = styled.div<{ isActive: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(89, 163, 214, 0.95);
    z-index: 999;
    display: ${(props) => (props.isActive ? 'flex' : 'none')};
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
    pointer-events: auto;
`;

const DropZoneContent = styled.div`
    text-align: center;
    color: white;
    user-select: none;
`;

const DropZoneIcon = styled.div`
    font-size: 80px;
    margin-bottom: 20px;
    animation: bounce 1s infinite;

    @keyframes bounce {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-20px);
        }
    }
`;

const DropZoneText = styled.div`
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 10px;
`;

const DropZoneSubText = styled.div`
    font-size: 16px;
    opacity: 0.9;
`;

export { DropZoneContent, DropZoneIcon, DropZoneOverlay, DropZoneSubText, DropZoneText };
