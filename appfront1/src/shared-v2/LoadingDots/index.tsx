import React from 'react';
import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  font-size: 14px;
  align-items: center;
  justify-content: center;
`;

const Text = styled.span`
  color: #1890ff;
  margin-right: 5px;
`;

const Dots = styled.span`
  display: flex;
  span {
    font-weight: bold;
    color: #1890ff;
    animation: ${bounce} 1.5s infinite;
  }

  span:nth-child(1) {
    animation-delay: 0s;
  }

  span:nth-child(2) {
    animation-delay: 0.3s;
  }

  span:nth-child(3) {
    animation-delay: 0.6s;
  }
`;

const LoadingDots = (props: {text: string}) => {
  return (
    <LoadingContainer>
      <Text>{props.text}</Text>
      <Dots>
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </Dots>
    </LoadingContainer>
  );
};

export default LoadingDots;
