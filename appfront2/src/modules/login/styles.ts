import { Button } from 'antd';
import styled from 'styled-components';

export const Container = styled.div`
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

export const StyledButton = styled(Button)`
  width: 100%;
  font-size: 15px;
  margin: 15px 0 0 0;
`;

export const Logo = styled.img`
  width: 100%;
  margin: 10px 0 50px 0;
  padding: 0 20px;
`;

export const Content = styled.div`
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
