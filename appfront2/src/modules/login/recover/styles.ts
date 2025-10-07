import { Button } from 'antd';
import styled from 'styled-components';

export const Container = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
  overflow: hidden;

  @keyframes wobble {
    50% {
      border-radius: 90% 90% 10% 10% / 50% 50% 50% 50%;
    }
    100% {
      border-radius: 50% 50% 50% 50% /90% 90% 10% 10%;
    }
  }

  &::before {
    background: rgba(0, 123, 255, 0.3);
    height: 120vh;
    min-width: 400px;
    width: 40%;
    content: '';
    position: absolute;
    left: -15%;
    border-radius: 50% 50% 50% 50% /90% 90% 10% 10%;
    z-index: 0;
    animation: wobble 18s ease-in-out infinite;
  }

  &::after {
    background: rgba(118, 75, 162, 0.2);
    height: 100vh;
    min-width: 300px;
    width: 30%;
    content: '';
    position: absolute;
    right: -10%;
    border-radius: 50% 50% 50% 50% /10% 10% 90% 90%;
    z-index: 0;
    animation: wobble 15s ease-in-out infinite reverse;
  }
`;

export const StyledButton = styled(Button)`
  width: 100%;
  font-size: 15px;
  margin: 15px 0 0 0;
`;

export const StyledText = styled.p`
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.6;
  margin: 12px 0;
  font-weight: 400;
`;

export const Logo = styled.img`
  width: 100%;
  height: auto;
  object-fit: contain;
  margin-bottom: 8px;
`;

export const Content = styled.div`
  max-width: 450px;
  min-width: 330px;
  width: 100%;
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 30px;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);

  @media screen and (max-width: 768px) {
    margin: 0 10px;
    padding: 20px;
    min-width: 280px;
  }

  .warning-login {
    font-size: 0.9em;
    color: rgb(216, 42, 42);
    text-align: right;
  }
`;
