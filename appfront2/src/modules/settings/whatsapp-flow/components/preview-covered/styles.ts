import styled from 'styled-components';

export const IframeContainer = styled.div`
  position: relative;
  height: 780px;
  overflow: hidden;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
`;

export const PreviewIframe = styled.iframe`
  position: absolute;
  width: 100%;
  height: 860px;
  bottom: 0;
  left: 0;
  border: none;
`;
