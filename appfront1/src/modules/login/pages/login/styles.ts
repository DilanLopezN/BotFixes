import styled from 'styled-components';

const Content = styled.div`
    background: url('/assets/img/botdesigner-info.svg') no-repeat;
    background-position: center left 70px;
    background-attachment: fixed;
    height: 100vh;
    display: flex;
    justify-content: flex-end;
    padding: 50px;
    align-items: center;

    @media screen and (max-width: 1300px) {
        background-position: center left 30px;
    }

    @keyframes wobble {
        50% {
            border-radius: 90% 90% 10% 10% / 50% 50% 50% 50%;
        }
        100% {
            border-radius: 50% 50% 50% 50% /90% 90% 10% 10%;
        }
    }

    &::before {
        background: #007bff;
        height: 120vh;
        min-width: 400px;
        width: 40%;
        content: '';
        position: absolute;
        left: -15%;
        border-radius: 50% 50% 50% 50% /90% 90% 10% 10%;
        z-index: -1;
        animation: wobble 18s ease-in-out infinite;
    }
`;

const Logo = styled.img`
    width: 100%;
    margin: 10px 0 50px 0;
    padding: 0 20px;
`;

const Card = styled.div`
    margin: 0 10% 0 0;
    max-width: 350px;
    min-width: 330px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 4px 1px 17px -5px #dbdbdb;
    padding: 15px 20px;

    @media screen and (max-width: 1500px) {
        margin: 0 20px 0 0;
    }

    @media screen and (max-width: 1300px) {
        margin: 0;
    }

    .warning-login {
        font-size: 0.9em;
        color: rgb(216, 42, 42);
        text-align: right;
    }
`;
const ForgotPasswordLink = styled.a`
    display: block;
    text-align: center;
    color: #007bff;
    text-decoration: none;
    font-size: 14px;
    margin-top: 16px;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
        color: #0056b3;
    }
`;

const Modal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 0 24px;
    border-bottom: 1px solid #e0e0e0;

    h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
    }
`;
const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;

    &:hover {
        background-color: #f5f5f5;
        color: #333;
    }
`;

const ModalBody = styled.div`
    padding: 24px;

    p {
        margin: 0 0 16px 0;
        color: #666;
        font-size: 14px;
        line-height: 1.5;
    }
`;

const ModalFooter = styled.div`
    display: flex;
    gap: 12px;
    padding: 0 24px 24px 24px;
    justify-content: flex-end;
`;

const Input = styled.input`
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    margin-bottom: 16px;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    &:disabled {
        background-color: #f5f5f5;
        color: #666;
        cursor: not-allowed;
    }

    &::placeholder {
        color: #999;
    }
`;

interface ButtonProps {
    variant?: 'primary' | 'secondary';
}

const Button = styled.button<ButtonProps>`
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid;
    min-width: 80px;
    transition: all 0.2s ease;

    ${(props) =>
        props.variant === 'primary'
            ? `
        background-color: #007bff;
        color: white;
        border-color: #007bff;
        
        &:hover:not(:disabled) {
            background-color: #0056b3;
            border-color: #0056b3;
        }
        
        &:disabled {
            background-color: #6c757d;
            border-color: #6c757d;
            cursor: not-allowed;
        }
    `
            : `
        background-color: white;
        color: #6c757d;
        border-color: #6c757d;
        
        &:hover:not(:disabled) {
            background-color: #f8f9fa;
            color: #5a6268;
            border-color: #5a6268;
        }
        
        &:disabled {
            color: #999;
            cursor: not-allowed;
        }
    `}
`;

const ErrorMessage = styled.div`
    color: #dc3545;
    font-size: 13px;
    margin-top: -8px;
    margin-bottom: 16px;
    padding: 8px 12px;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
`;

const SuccessMessage = styled.div`
    color: #155724;
    font-size: 13px;
    margin-top: -8px;
    margin-bottom: 16px;
    padding: 8px 12px;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
`;
export {
    Content,
    Logo,
    Card,
    ForgotPasswordLink,
    SuccessMessage,
    ErrorMessage,
    Button,
    Input,
    ModalFooter,
    ModalBody,
    CloseButton,
    ModalHeader,
    ModalContent,
    Modal,
};
